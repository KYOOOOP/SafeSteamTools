import Redis from 'redis';
import NodeCache from 'node-cache';
import { config } from '../config';
import { logger } from '../utils/logger';

export class CacheManager {
  private redisClient?: Redis.RedisClientType;
  private memoryCache: NodeCache;
  private useRedis = false;

  constructor() {
    // Fallback to in-memory cache if Redis is not available
    this.memoryCache = new NodeCache({
      stdTTL: config.CACHE_TTL_SECONDS,
      checkperiod: 60, // Check for expired keys every 60 seconds
      useClones: false, // Better performance
    });
  }

  public async connect(): Promise<void> {
    try {
      // Try to connect to Redis
      this.redisClient = Redis.createClient({
        url: config.REDIS_URL,
        socket: {
          connectTimeout: 5000,
          lazyConnect: true,
        },
        retryDelayOnFailover: 100,
        enableAutoPipelining: true,
      });

      this.redisClient.on('error', (err) => {
        logger.error('Redis connection error:', err);
        this.useRedis = false;
      });

      this.redisClient.on('connect', () => {
        logger.info('Connected to Redis cache');
        this.useRedis = true;
      });

      this.redisClient.on('ready', () => {
        logger.info('Redis client ready');
        this.useRedis = true;
      });

      await this.redisClient.connect();
      this.useRedis = true;
      
    } catch (error) {
      logger.warn('Redis connection failed, using in-memory cache:', error);
      this.useRedis = false;
    }
  }

  public async disconnect(): Promise<void> {
    if (this.redisClient && this.useRedis) {
      try {
        await this.redisClient.quit();
        logger.info('Disconnected from Redis');
      } catch (error) {
        logger.error('Error disconnecting from Redis:', error);
      }
    }
    
    this.memoryCache.close();
    logger.info('Memory cache closed');
  }

  public async get<T>(key: string): Promise<T | null> {
    try {
      if (this.useRedis && this.redisClient) {
        const value = await this.redisClient.get(key);
        if (value) {
          return JSON.parse(value) as T;
        }
      } else {
        const value = this.memoryCache.get<T>(key);
        if (value !== undefined) {
          return value;
        }
      }
      return null;
    } catch (error) {
      logger.error('Cache get error:', error);
      return null;
    }
  }

  public async set(key: string, value: any, ttlSeconds?: number): Promise<boolean> {
    try {
      const ttl = ttlSeconds || config.CACHE_TTL_SECONDS;
      
      if (this.useRedis && this.redisClient) {
        await this.redisClient.setEx(key, ttl, JSON.stringify(value));
        return true;
      } else {
        return this.memoryCache.set(key, value, ttl);
      }
    } catch (error) {
      logger.error('Cache set error:', error);
      return false;
    }
  }

  public async del(key: string): Promise<boolean> {
    try {
      if (this.useRedis && this.redisClient) {
        const result = await this.redisClient.del(key);
        return result > 0;
      } else {
        return this.memoryCache.del(key) > 0;
      }
    } catch (error) {
      logger.error('Cache delete error:', error);
      return false;
    }
  }

  public async clear(): Promise<boolean> {
    try {
      if (this.useRedis && this.redisClient) {
        await this.redisClient.flushAll();
      }
      this.memoryCache.flushAll();
      logger.info('Cache cleared');
      return true;
    } catch (error) {
      logger.error('Cache clear error:', error);
      return false;
    }
  }

  public async keys(pattern: string): Promise<string[]> {
    try {
      if (this.useRedis && this.redisClient) {
        return await this.redisClient.keys(pattern);
      } else {
        const allKeys = this.memoryCache.keys();
        // Simple pattern matching for memory cache
        const regex = new RegExp(pattern.replace(/\*/g, '.*'));
        return allKeys.filter(key => regex.test(key));
      }
    } catch (error) {
      logger.error('Cache keys error:', error);
      return [];
    }
  }

  public getStats(): { hits: number; misses: number; keys: number } {
    if (this.useRedis) {
      // Redis doesn't provide simple stats, return placeholder
      return { hits: 0, misses: 0, keys: 0 };
    } else {
      const stats = this.memoryCache.getStats();
      return {
        hits: stats.hits,
        misses: stats.misses,
        keys: stats.keys,
      };
    }
  }
}