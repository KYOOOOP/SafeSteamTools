import { Router } from 'express';
import { profileRouter } from './profile';
import { gamesRouter } from './games';
import { inventoryRouter } from './inventory';
import { requestLogger, sanitizeInput } from '../middleware/security';

const apiRouter = Router();

// Apply common middleware
apiRouter.use(requestLogger);
apiRouter.use(sanitizeInput);

// Mount route modules
apiRouter.use('/profile', profileRouter);
apiRouter.use('/games', gamesRouter);
apiRouter.use('/inventory', inventoryRouter);

// API info endpoint
apiRouter.get('/', (req, res) => {
  res.json({
    name: 'SafeSteamTools API',
    version: '1.0.0',
    description: 'Legal, secure Steam data viewer API',
    endpoints: {
      profile: '/api/profile/:steamid',
      games: '/api/games/:steamid',
      inventory: '/api/inventory/:steamid/:appid',
    },
    legal: {
      notice: 'This API uses only official Steam Web APIs',
      privacy: 'Only public Steam data is accessed',
      security: 'No passwords or credentials are collected',
      disclaimer: 'Not affiliated with Valve Corporation',
    },
  });
});

export { apiRouter };