import { Router, Request, Response, NextFunction } from 'express';
import { steamApiService } from '../services/steamApi';
import { CacheManager } from '../cache';
import { logger } from '../utils/logger';

const gamesRouter = Router();
const cache = new CacheManager();

/**
 * GET /api/games/:steamid
 * Get owned games for a Steam user
 */
gamesRouter.get('/:steamid', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { steamid } = req.params;
    const cacheKey = `games:${steamid}`;

    // Check cache first
    const cachedGames = await cache.get(cacheKey);
    if (cachedGames) {
      logger.info(`Returning cached games for ${steamid}`);
      return res.json({
        steamid,
        game_count: cachedGames.length,
        games: cachedGames,
        cached: true,
        timestamp: new Date().toISOString(),
      });
    }

    // Fetch from Steam API
    const games = await steamApiService.getOwnedGames(steamid);
    
    // Cache the result
    if (games.length > 0) {
      await cache.set(cacheKey, games, 300); // Cache for 5 minutes
    }

    // Return games data
    res.json({
      steamid,
      game_count: games.length,
      games: games.map(game => ({
        appid: game.appid,
        name: game.name,
        playtime_forever: game.playtime_forever,
        playtime_2weeks: game.playtime_2weeks || 0,
        img_icon_url: game.img_icon_url ? 
          `https://media.steampowered.com/steamcommunity/public/images/apps/${game.appid}/${game.img_icon_url}.jpg` : null,
        img_logo_url: game.img_logo_url ? 
          `https://media.steampowered.com/steamcommunity/public/images/apps/${game.appid}/${game.img_logo_url}.jpg` : null,
        rtime_last_played: game.rtime_last_played,
      })),
      cached: false,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/games/:steamid/:appid/achievements
 * Get achievements for a specific game
 */
gamesRouter.get('/:steamid/:appid/achievements', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { steamid, appid } = req.params;
    const appIdNum = parseInt(appid, 10);
    const cacheKey = `achievements:${steamid}:${appIdNum}`;

    // Check cache first
    const cachedAchievements = await cache.get(cacheKey);
    if (cachedAchievements) {
      logger.info(`Returning cached achievements for ${steamid} app ${appIdNum}`);
      return res.json({
        steamid,
        appid: appIdNum,
        achievements: cachedAchievements,
        cached: true,
        timestamp: new Date().toISOString(),
      });
    }

    // Fetch from Steam API
    const achievements = await steamApiService.getPlayerAchievements(steamid, appIdNum);
    
    if (!achievements || !achievements.achievements) {
      return res.json({
        steamid,
        appid: appIdNum,
        achievements: null,
        error: 'Achievements not available (game may not support achievements or data is private)',
        cached: false,
        timestamp: new Date().toISOString(),
      });
    }

    // Cache the result
    await cache.set(cacheKey, achievements, 600); // Cache for 10 minutes

    // Return achievements data
    res.json({
      steamid,
      appid: appIdNum,
      game_name: achievements.gameName,
      achievements: achievements.achievements?.map((achievement: any) => ({
        apiname: achievement.apiname,
        achieved: achievement.achieved,
        unlocktime: achievement.unlocktime,
        name: achievement.name,
        description: achievement.description,
      })),
      cached: false,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    next(error);
  }
});

export { gamesRouter };