/**
 * @module modules/backend
 * Server API specifications and client request schemas.
 * 
 * NOTE FOR BROWSER RUNTIMES:
 * Do not import server implementations directly into browser code.
 * Browser clients should communicate via HTTP fetch() calls using the routes below.
 */

export const ApiEndpoints = {
  HEALTH: '/health',
  WARDROBE_ITEMS: '/api/wardrobe/items',
  DAILY_LOOKS: '/api/looks/daily',
  STREAK_STATUS: '/api/streak/status',
  AUTH_SESSION: '/api/auth/session'
};

export const BackendContract = {
  endpoints: ApiEndpoints,
  
  // Server-side health check responder contract
  healthCheck: () => ({
    status: 'UP',
    version: '1.0.0',
    timestamp: Date.now()
  })
};

export default BackendContract;
