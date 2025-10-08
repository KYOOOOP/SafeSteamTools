import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { config } from '../config';
import { logger } from '../utils/logger';
import { createError } from '../middleware/errorHandler';

interface SteamProfile {
  steamid: string;
  communityvisibilitystate: number;
  profilestate?: number;
  personaname: string;
  profileurl?: string;
  avatar?: string;
  avatarmedium?: string;
  avatarfull?: string;
  personastate?: number;
  realname?: string;
  primaryclanid?: string;
  timecreated?: number;
  personastateflags?: number;
  loccountrycode?: string;
  locstatecode?: string;
  loccityid?: number;
}

interface SteamGame {
  appid: number;
  name: string;
  playtime_forever: number;
  img_icon_url?: string;
  img_logo_url?: string;
  playtime_windows_forever?: number;
  playtime_mac_forever?: number;
  playtime_linux_forever?: number;
  rtime_last_played?: number;
}

interface InventoryItem {
  assetid: string;
  classid: string;
  instanceid: string;
  amount: string;
  pos?: number;
}

interface InventoryDescription {
  appid: number;
  classid: string;
  instanceid: string;
  currency: number;
  background_color?: string;
  icon_url?: string;
  icon_url_large?: string;
  descriptions?: Array<{
    type: string;
    value: string;
  }>;
  tradable: number;
  name: string;
  name_color?: string;
  type: string;
  market_name?: string;
  market_hash_name?: string;
  market_tradable_restriction?: number;
  marketable: number;
  commodity: number;
}

class SteamApiService {
  private client: AxiosInstance;
  private lastRequestTime = 0;
  private readonly requestDelay = 1000; // 1 second between requests to respect Steam's limits

  constructor() {
    this.client = axios.create({
      baseURL: config.STEAM_API_BASE_URL,
      timeout: 10000,
      headers: {
        'User-Agent': 'SafeSteamTools/1.0.0 (Legal Steam Data Viewer)',
      },
    });

    // Request interceptor for rate limiting
    this.client.interceptors.request.use(async (config) => {
      const now = Date.now();
      const timeSinceLastRequest = now - this.lastRequestTime;
      
      if (timeSinceLastRequest < this.requestDelay) {
        const delay = this.requestDelay - timeSinceLastRequest;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      
      this.lastRequestTime = Date.now();
      return config;
    });

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        logger.error('Steam API request failed:', {
          url: error.config?.url,
          status: error.response?.status,
          message: error.message,
        });
        
        if (error.response?.status === 403) {
          throw createError('Steam profile is private or does not exist', 403, 'PRIVATE_PROFILE');
        }
        
        if (error.response?.status === 401) {
          throw createError('Invalid Steam API key', 401, 'INVALID_API_KEY');
        }
        
        throw createError('Steam API request failed', 502, 'STEAM_API_ERROR', {
          status: error.response?.status,
          message: error.message,
        });
      }
    );
  }

  /**
   * Get Steam user profile information
   * Uses ISteamUser/GetPlayerSummaries/v0002
   */
  public async getProfile(steamId: string): Promise<SteamProfile> {
    try {
      logger.info(`Fetching Steam profile for: ${steamId}`);
      
      const response: AxiosResponse = await this.client.get('/ISteamUser/GetPlayerSummaries/v0002/', {
        params: {
          key: config.STEAM_API_KEY,
          steamids: steamId,
        },
      });

      const players = response.data?.response?.players;
      if (!players || players.length === 0) {
        throw createError('Steam profile not found', 404, 'PROFILE_NOT_FOUND');
      }

      const profile = players[0] as SteamProfile;
      
      // Check if profile is public
      if (profile.communityvisibilitystate !== 3) {
        throw createError('Steam profile is private', 403, 'PRIVATE_PROFILE');
      }

      return profile;
    } catch (error) {
      if (error instanceof Error && 'statusCode' in error) {
        throw error;
      }
      
      logger.error('Failed to fetch Steam profile:', error);
      throw createError('Failed to fetch Steam profile', 500, 'PROFILE_FETCH_ERROR');
    }
  }

  /**
   * Get owned games for a Steam user
   * Uses IPlayerService/GetOwnedGames/v0001
   */
  public async getOwnedGames(steamId: string): Promise<SteamGame[]> {
    try {
      logger.info(`Fetching owned games for: ${steamId}`);
      
      const response: AxiosResponse = await this.client.get('/IPlayerService/GetOwnedGames/v0001/', {
        params: {
          key: config.STEAM_API_KEY,
          steamid: steamId,
          format: 'json',
          include_appinfo: true,
          include_played_free_games: true,
        },
      });

      const games = response.data?.response?.games;
      if (!games) {
        // Games list might be private or empty
        return [];
      }

      return games as SteamGame[];
    } catch (error) {
      logger.error('Failed to fetch owned games:', error);
      // Return empty array instead of throwing - games might be private
      return [];
    }
  }

  /**
   * Get player achievements for a specific game
   * Uses ISteamUserStats/GetPlayerAchievements/v0001
   */
  public async getPlayerAchievements(steamId: string, appId: number): Promise<any> {
    try {
      logger.info(`Fetching achievements for ${steamId} in app ${appId}`);
      
      const response: AxiosResponse = await this.client.get('/ISteamUserStats/GetPlayerAchievements/v0001/', {
        params: {
          key: config.STEAM_API_KEY,
          steamid: steamId,
          appid: appId,
          l: 'english',
        },
      });

      return response.data?.playerstats;
    } catch (error) {
      logger.debug('Failed to fetch achievements (might be private or unsupported):', error);
      return null;
    }
  }

  /**
   * Get Steam inventory for a user and specific app
   * Uses Steam Community API
   */
  public async getInventory(steamId: string, appId: number, contextId = 2): Promise<{
    assets: InventoryItem[];
    descriptions: InventoryDescription[];
  }> {
    try {
      logger.info(`Fetching inventory for ${steamId} app ${appId}`);
      
      // Use Steam Community API for inventory
      const response: AxiosResponse = await axios.get(
        `${config.STEAM_COMMUNITY_BASE_URL}/inventory/${steamId}/${appId}/${contextId}`,
        {
          timeout: 10000,
          headers: {
            'User-Agent': 'SafeSteamTools/1.0.0 (Legal Steam Data Viewer)',
          },
        }
      );

      return {
        assets: response.data?.assets || [],
        descriptions: response.data?.descriptions || [],
      };
    } catch (error) {
      logger.debug('Failed to fetch inventory (might be private):', error);
      return {
        assets: [],
        descriptions: [],
      };
    }
  }

  /**
   * Get market price for an item
   * Uses Steam Market API
   */
  public async getMarketPrice(appId: number, marketHashName: string): Promise<{
    success: boolean;
    lowest_price?: string;
    volume?: string;
    median_price?: string;
  }> {
    try {
      const response: AxiosResponse = await axios.get(
        `${config.STEAM_COMMUNITY_BASE_URL}/market/priceoverview/`,
        {
          params: {
            appid: appId,
            currency: 1, // USD
            market_hash_name: marketHashName,
          },
          timeout: 5000,
          headers: {
            'User-Agent': 'SafeSteamTools/1.0.0 (Legal Steam Data Viewer)',
          },
        }
      );

      return response.data;
    } catch (error) {
      logger.debug('Failed to fetch market price:', error);
      return { success: false };
    }
  }
}

export const steamApiService = new SteamApiService();