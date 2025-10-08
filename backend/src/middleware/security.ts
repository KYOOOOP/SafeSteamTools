import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

// Security headers and validation middleware
export const securityMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // Remove powered-by header
  res.removeHeader('X-Powered-By');
  
  // Add security headers
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()'
  });

  // Block suspicious patterns in URLs
  const suspiciousPatterns = [
    /\.\.\//g,  // Path traversal
    /<script/gi, // XSS attempts
    /javascript:/gi, // JavaScript protocol
    /data:.*base64/gi, // Data URIs
    /eval\(/gi, // Eval attempts
  ];

  const url = req.originalUrl;
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(url)) {
      logger.warn('Blocked suspicious request:', {
        url,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      });
      
      return res.status(400).json({
        error: 'Invalid request format',
        code: 'SECURITY_VIOLATION'
      });
    }
  }

  // Validate request size
  const contentLength = req.get('content-length');
  if (contentLength && parseInt(contentLength, 10) > 1024 * 1024) { // 1MB limit
    return res.status(413).json({
      error: 'Request too large',
      code: 'PAYLOAD_TOO_LARGE'
    });
  }

  next();
};

// Input sanitization middleware
export const sanitizeInput = (req: Request, res: Response, next: NextFunction): void => {
  // Sanitize Steam ID format
  if (req.params.steamid) {
    const steamId = req.params.steamid;
    // Steam ID should be 17 digits
    if (!/^\d{17}$/.test(steamId)) {
      return res.status(400).json({
        error: 'Invalid Steam ID format',
        code: 'INVALID_STEAM_ID'
      });
    }
  }

  // Sanitize App ID format
  if (req.params.appid) {
    const appId = req.params.appid;
    // App ID should be numeric
    if (!/^\d+$/.test(appId)) {
      return res.status(400).json({
        error: 'Invalid App ID format',
        code: 'INVALID_APP_ID'
      });
    }
  }

  next();
};

// Request logging middleware
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    
    logger.info('API Request:', {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      steamId: req.params.steamid,
    });
  });

  next();
};