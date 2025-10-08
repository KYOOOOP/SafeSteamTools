import dotenv from 'dotenv';
import { logger } from '../utils/logger';

// Load environment variables
dotenv.config();

// Validate required environment variables
const requiredVars = ['STEAM_API_KEY'];
const missingVars = requiredVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  logger.error(`Missing required environment variables: ${missingVars.join(', ')}`);
  process.exit(1);
}

// Security: Validate Steam API key format
const steamApiKey = process.env.STEAM_API_KEY!;
if (!/^[A-F0-9]{32}$/.test(steamApiKey)) {
  logger.warn('Steam API key format appears invalid (should be 32 hex characters)');
}

export const config = {
  // Server configuration
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '3001', 10),
  
  // Steam API configuration
  STEAM_API_KEY: steamApiKey,
  STEAM_API_BASE_URL: 'https://api.steampowered.com',
  STEAM_COMMUNITY_BASE_URL: 'https://steamcommunity.com',
  
  // Database configuration
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://safesteam:safesteam@localhost:5432/safesteam',
  
  // Redis configuration
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  
  // CORS configuration
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000',
  
  // Rate limiting configuration
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  
  // Caching configuration
  CACHE_TTL_SECONDS: parseInt(process.env.CACHE_TTL_SECONDS || '300', 10), // 5 minutes
  
  // Security configuration
  JWT_SECRET: process.env.JWT_SECRET || 'development-secret-change-in-production',
  SESSION_SECRET: process.env.SESSION_SECRET || 'development-session-secret',
  
  // Steam API rate limits (respect Steam's limits)
  STEAM_API_RATE_LIMIT: {
    requestsPerSecond: 1,
    burstLimit: 5,
  },
} as const;

// Validate configuration
if (config.NODE_ENV === 'production') {
  if (config.JWT_SECRET.includes('development') || config.SESSION_SECRET.includes('development')) {
    logger.error('Production secrets must be changed from development defaults');
    process.exit(1);
  }
}

logger.info('Configuration loaded successfully');