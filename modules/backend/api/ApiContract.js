/**
 * Woobi - Backend Module
 * ApiContract.js - HTTP REST Endpoint Routes & Response Envelopes
 */

export const API_ROUTES = {
  HEALTH: '/health',

  // Authentication
  AUTH_REGISTER: '/api/auth/register',
  AUTH_LOGIN: '/api/auth/login',
  AUTH_LOGOUT: '/api/auth/logout',
  AUTH_ME: '/api/auth/me',

  // User & Profile
  USER_PROFILE: '/api/user/profile',

  // Server-Authoritative Subscription Entitlement
  USER_SUBSCRIPTION: '/api/user/subscription',
  USER_SUBSCRIPTION_VERIFY: '/api/user/subscription/verify',

  // Wardrobe Items
  WARDROBE_ITEMS: '/api/wardrobe/items',
  WARDROBE_ITEM_DETAIL: '/api/wardrobe/items/:id',

  // Saved Looks & Outfits
  SAVED_LOOKS: '/api/looks',
  SAVED_LOOK_DETAIL: '/api/looks/:id',

  // 3D Avatar Preferences
  AVATAR_PREFERENCES: '/api/avatar/preferences',

  // User Application Settings
  USER_SETTINGS: '/api/settings',

  // Daily Streak
  STREAK_STATUS: '/api/streak',
  STREAK_RECORD: '/api/streak/record',

  // Storage & Media Uploads
  STORAGE_UPLOAD: '/api/storage/upload',
  STORAGE_FILE: '/api/storage/files/:filename'
};

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_ERROR: 500
};

export const ApiContract = {
  routes: API_ROUTES,
  status: HTTP_STATUS,
  createSuccessEnvelope: (data) => ({ success: true, data }),
  createErrorEnvelope: (error, details = null) => ({ success: false, error, details })
};

export default ApiContract;
