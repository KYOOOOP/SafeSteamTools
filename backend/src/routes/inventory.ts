import { Router, Request, Response, NextFunction } from 'express';
import { steamApiService } from '../services/steamApi';
import { CacheManager } from '../cache';
import { logger } from '../utils/logger';

const inventoryRouter = Router();
const cache = new CacheManager();

/**
 * GET /api/inventory/:steamid/:appid
 * Get Steam inventory for a user and specific app
 */
inventoryRouter.get('/:steamid/:appid', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { steamid, appid } = req.params;
    const appIdNum = parseInt(appid, 10);
    const contextId = parseInt(req.query.context_id as string || '2', 10);
    const cacheKey = `inventory:${steamid}:${appIdNum}:${contextId}`;

    // Check cache first
    const cachedInventory = await cache.get(cacheKey);
    if (cachedInventory) {
      logger.info(`Returning cached inventory for ${steamid} app ${appIdNum}`);
      return res.json({
        steamid,
        appid: appIdNum,
        context_id: contextId,
        ...cachedInventory,
        cached: true,
        timestamp: new Date().toISOString(),
      });
    }

    // Fetch from Steam API
    const inventory = await steamApiService.getInventory(steamid, appIdNum, contextId);
    
    // Process inventory data
    const processedItems = inventory.assets.map(asset => {
      const description = inventory.descriptions.find(
        desc => desc.classid === asset.classid && desc.instanceid === asset.instanceid
      );
      
      return {
        assetid: asset.assetid,
        classid: asset.classid,
        instanceid: asset.instanceid,
        amount: asset.amount,
        name: description?.name,
        type: description?.type,
        market_name: description?.market_name,
        market_hash_name: description?.market_hash_name,
        icon_url: description?.icon_url ? 
          `https://community.akamai.steamstatic.com/economy/image/${description.icon_url}` : null,
        tradable: description?.tradable === 1,
        marketable: description?.marketable === 1,
        commodity: description?.commodity === 1,
        background_color: description?.background_color,
      };
    });

    const result = {
      item_count: processedItems.length,
      items: processedItems,
      total_inventory_count: inventory.assets.length,
    };

    // Cache the result
    if (processedItems.length > 0) {
      await cache.set(cacheKey, result, 600); // Cache for 10 minutes
    }

    // Return inventory data
    res.json({
      steamid,
      appid: appIdNum,
      context_id: contextId,
      ...result,
      cached: false,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/inventory/:steamid/:appid/prices
 * Get market prices for inventory items
 */
inventoryRouter.get('/:steamid/:appid/prices', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { steamid, appid } = req.params;
    const appIdNum = parseInt(appid, 10);
    const limit = parseInt(req.query.limit as string || '20', 10);
    const contextId = parseInt(req.query.context_id as string || '2', 10);
    
    const inventoryCacheKey = `inventory:${steamid}:${appIdNum}:${contextId}`;
    const pricesCacheKey = `prices:${steamid}:${appIdNum}:${contextId}:${limit}`;

    // Check prices cache first
    const cachedPrices = await cache.get(pricesCacheKey);
    if (cachedPrices) {
      logger.info(`Returning cached prices for ${steamid} app ${appIdNum}`);
      return res.json({
        steamid,
        appid: appIdNum,
        context_id: contextId,
        ...cachedPrices,
        cached: true,
        timestamp: new Date().toISOString(),
      });
    }

    // Get inventory first
    let inventory = await cache.get(inventoryCacheKey);
    if (!inventory) {
      const rawInventory = await steamApiService.getInventory(steamid, appIdNum, contextId);
      inventory = {
        item_count: rawInventory.assets.length,
        items: rawInventory.assets.map(asset => {
          const description = rawInventory.descriptions.find(
            desc => desc.classid === asset.classid && desc.instanceid === asset.instanceid
          );
          return {
            market_hash_name: description?.market_hash_name,
            marketable: description?.marketable === 1,
            name: description?.name,
          };
        }),
      };
      await cache.set(inventoryCacheKey, inventory, 600);
    }

    // Get market prices for marketable items (limited to prevent API abuse)
    const marketableItems = inventory.items
      .filter((item: any) => item.marketable && item.market_hash_name)
      .slice(0, limit);

    const itemsWithPrices = await Promise.all(
      marketableItems.map(async (item: any) => {
        try {
          const priceData = await steamApiService.getMarketPrice(appIdNum, item.market_hash_name);
          return {
            name: item.name,
            market_hash_name: item.market_hash_name,
            lowest_price: priceData.lowest_price || 'N/A',
            median_price: priceData.median_price || 'N/A',
            volume: priceData.volume || 'N/A',
            success: priceData.success,
          };
        } catch (error) {
          return {
            name: item.name,
            market_hash_name: item.market_hash_name,
            lowest_price: 'N/A',
            median_price: 'N/A',
            volume: 'N/A',
            success: false,
            error: 'Price not available',
          };
        }
      })
    );

    const result = {
      total_items: inventory.item_count,
      marketable_items: marketableItems.length,
      priced_items: itemsWithPrices.filter(item => item.success).length,
      items_with_prices: itemsWithPrices,
      disclaimer: 'Prices are estimates and may not reflect actual market values. Not guaranteed to be accurate.',
    };

    // Cache the result
    await cache.set(pricesCacheKey, result, 1800); // Cache for 30 minutes

    // Return pricing data
    res.json({
      steamid,
      appid: appIdNum,
      context_id: contextId,
      limit,
      ...result,
      cached: false,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    next(error);
  }
});

export { inventoryRouter };