import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { config } from './config';
import { logger } from './utils/logger';
import { apiRouter } from './routes';
import { errorHandler } from './middleware/errorHandler';
import { securityMiddleware } from './middleware/security';
import { DatabaseManager } from './database';
import { CacheManager } from './cache';

class SafeSteamToolsServer {
  private app: express.Application;
  private database: DatabaseManager;
  private cache: CacheManager;

  constructor() {
    this.app = express();
    this.database = new DatabaseManager();
    this.cache = new CacheManager();
  }

  private setupSecurity(): void {
    // Rate limiting
    const limiter = rateLimit({
      windowMs: config.RATE_LIMIT_WINDOW_MS,
      max: config.RATE_LIMIT_MAX_REQUESTS,
      message: {
        error: 'Too many requests from this IP, please try again later.',
        code: 'RATE_LIMIT_EXCEEDED'
      },
      standardHeaders: true,
      legacyHeaders: false,
    });

    this.app.use(limiter);
    this.app.use(helmet());
    this.app.use(securityMiddleware);
  }

  private setupMiddleware(): void {
    this.app.use(compression());
    this.app.use(cors({
      origin: config.CORS_ORIGIN,
      credentials: false,
      methods: ['GET'],
      allowedHeaders: ['Content-Type', 'Accept'],
    }));
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  }

  private setupRoutes(): void {
    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
      });
    });

    // API routes
    this.app.use('/api', apiRouter);

    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        error: 'Endpoint not found',
        code: 'NOT_FOUND'
      });
    });

    // Error handling
    this.app.use(errorHandler);
  }

  public async start(): Promise<void> {
    try {
      // Initialize database and cache connections
      await this.database.connect();
      await this.cache.connect();

      // Setup middleware and routes
      this.setupSecurity();
      this.setupMiddleware();
      this.setupRoutes();

      // Start server
      const server = this.app.listen(config.PORT, () => {
        logger.info(`SafeSteamTools API server running on port ${config.PORT}`);
        logger.info(`Environment: ${config.NODE_ENV}`);
      });

      // Graceful shutdown
      process.on('SIGTERM', async () => {
        logger.info('SIGTERM received, shutting down gracefully');
        server.close(async () => {
          await this.database.disconnect();
          await this.cache.disconnect();
          process.exit(0);
        });
      });

    } catch (error) {
      logger.error('Failed to start server:', error);
      process.exit(1);
    }
  }
}

// Start the server
if (require.main === module) {
  const server = new SafeSteamToolsServer();
  server.start().catch((error) => {
    logger.error('Server startup failed:', error);
    process.exit(1);
  });
}

export { SafeSteamToolsServer };