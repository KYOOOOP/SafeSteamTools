import { Router, Request, Response, NextFunction } from 'express';
import { steamApiService } from '../services/steamApi';
import { CacheManager } from '../cache';
import { createError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

const profileRouter = Router();
const cache = new CacheManager();

/**
 * GET /api/profile/:steamid
 * Get Steam profile information for a user
 */
profileRouter.get('/:steamid', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { steamid } = req.params;
    const cacheKey = `profile:${steamid}`;

    // Check cache first
    const cachedProfile = await cache.get(cacheKey);
    if (cachedProfile) {
      logger.info(`Returning cached profile for ${steamid}`);
      return res.json({
        ...cachedProfile,
        cached: true,
        timestamp: new Date().toISOString(),
      });
    }

    // Fetch from Steam API
    const profile = await steamApiService.getProfile(steamid);
    
    // Cache the result
    await cache.set(cacheKey, profile, 300); // Cache for 5 minutes

    // Return profile data
    res.json({
      steamid: profile.steamid,
      personaname: profile.personaname,
      realname: profile.realname,
      avatarfull: profile.avatarfull,
      avatarmedium: profile.avatarmedium,
      avatar: profile.avatar,
      profileurl: profile.profileurl,
      loccountrycode: profile.loccountrycode,
      locstatecode: profile.locstatecode,
      timecreated: profile.timecreated,
      communityvisibilitystate: profile.communityvisibilitystate,
      profilestate: profile.profilestate,
      personastate: profile.personastate,
      cached: false,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/profile/:steamid/export
 * Export profile data as JSON
 */
profileRouter.get('/:steamid/export', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { steamid } = req.params;
    const cacheKey = `profile:${steamid}`;

    // Check cache first
    let profile = await cache.get(cacheKey);
    
    if (!profile) {
      // Fetch from Steam API if not cached
      profile = await steamApiService.getProfile(steamid);
      await cache.set(cacheKey, profile, 300);
    }

    // Set appropriate headers for file download
    res.setHeader('Content-Disposition', `attachment; filename="steam_profile_${steamid}.json"`);
    res.setHeader('Content-Type', 'application/json');
    
    res.json({
      export_info: {
        generated_at: new Date().toISOString(),
        source: 'SafeSteamTools',
        steam_id: steamid,
        data_type: 'public_profile',
        legal_notice: 'This data was obtained through official Steam Web APIs and contains only publicly available information.',
      },
      profile_data: {
        steamid: profile.steamid,
        personaname: profile.personaname,
        realname: profile.realname,
        avatarfull: profile.avatarfull,
        avatarmedium: profile.avatarmedium,
        avatar: profile.avatar,
        profileurl: profile.profileurl,
        loccountrycode: profile.loccountrycode,
        locstatecode: profile.locstatecode,
        timecreated: profile.timecreated,
        communityvisibilitystate: profile.communityvisibilitystate,
        profilestate: profile.profilestate,
        personastate: profile.personastate,
      },
    });

  } catch (error) {
    next(error);
  }
});

export { profileRouter };