import { Pool, PoolClient } from 'pg';
import { config } from '../config';
import { logger } from '../utils/logger';

export class DatabaseManager {
  private pool?: Pool;

  public async connect(): Promise<void> {
    try {
      this.pool = new Pool({
        connectionString: config.DATABASE_URL,
        ssl: config.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      });

      // Test connection
      const client = await this.pool.connect();
      await client.query('SELECT NOW()');
      client.release();
      
      logger.info('Connected to PostgreSQL database');
      
      // Setup cleanup job for expired cache
      this.setupCleanupJob();
      
    } catch (error) {
      logger.error('Failed to connect to database:', error);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      logger.info('Disconnected from PostgreSQL database');
    }
  }

  public async query(text: string, params?: any[]): Promise<any> {
    if (!this.pool) {
      throw new Error('Database not connected');
    }
    
    try {
      const result = await this.pool.query(text, params);
      return result;
    } catch (error) {
      logger.error('Database query error:', { text, params, error });
      throw error;
    }
  }

  public async getClient(): Promise<PoolClient> {
    if (!this.pool) {
      throw new Error('Database not connected');
    }
    return await this.pool.connect();
  }

  // Cache management methods
  public async getCachedProfile(steamId: string): Promise<any | null> {
    try {
      const result = await this.query(
        'SELECT profile_data FROM steam_profiles WHERE steam_id = $1 AND expires_at > NOW()',
        [steamId]
      );
      
      return result.rows.length > 0 ? result.rows[0].profile_data : null;
    } catch (error) {
      logger.error('Error getting cached profile:', error);
      return null;
    }
  }

  public async setCachedProfile(steamId: string, profileData: any, ttlSeconds = 300): Promise<boolean> {
    try {
      const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
      
      await this.query(
        `INSERT INTO steam_profiles (steam_id, profile_data, privacy_state, expires_at) 
         VALUES ($1, $2, $3, $4) 
         ON CONFLICT (steam_id) 
         DO UPDATE SET profile_data = $2, privacy_state = $3, expires_at = $4, updated_at = NOW()`,
        [steamId, JSON.stringify(profileData), profileData.communityvisibilitystate || 1, expiresAt]
      );
      
      return true;
    } catch (error) {
      logger.error('Error caching profile:', error);
      return false;
    }
  }

  public async getCachedGames(steamId: string): Promise<any | null> {
    try {
      const result = await this.query(
        'SELECT games_data FROM steam_games WHERE steam_id = $1 AND expires_at > NOW()',
        [steamId]
      );
      
      return result.rows.length > 0 ? result.rows[0].games_data : null;
    } catch (error) {
      logger.error('Error getting cached games:', error);
      return null;
    }
  }

  public async setCachedGames(steamId: string, gamesData: any[], ttlSeconds = 300): Promise<boolean> {
    try {
      const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
      
      await this.query(
        `INSERT INTO steam_games (steam_id, games_data, game_count, expires_at) 
         VALUES ($1, $2, $3, $4) 
         ON CONFLICT (steam_id) 
         DO UPDATE SET games_data = $2, game_count = $3, expires_at = $4, updated_at = NOW()`,
        [steamId, JSON.stringify(gamesData), gamesData.length, expiresAt]
      );
      
      return true;
    } catch (error) {
      logger.error('Error caching games:', error);
      return false;
    }
  }

  public async logApiUsage(
    endpoint: string,
    method: string,
    statusCode: number,
    responseTime: number,
    ipAddress?: string,
    userAgent?: string,
    steamId?: string,
    cached = false
  ): Promise<void> {
    try {
      await this.query(
        `INSERT INTO api_usage (endpoint, method, status_code, response_time_ms, ip_address, user_agent, steam_id, cached) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [endpoint, method, statusCode, responseTime, ipAddress, userAgent, steamId, cached]
      );
    } catch (error) {
      logger.error('Error logging API usage:', error);
    }
  }

  private setupCleanupJob(): void {
    // Run cleanup every hour
    setInterval(async () => {
      try {
        const result = await this.query('SELECT cleanup_expired_cache()');
        const deletedCount = result.rows[0]?.cleanup_expired_cache || 0;
        
        if (deletedCount > 0) {
          logger.info(`Cleaned up ${deletedCount} expired cache entries`);
        }
      } catch (error) {
        logger.error('Error running cache cleanup:', error);
      }
    }, 60 * 60 * 1000); // 1 hour
  }
}