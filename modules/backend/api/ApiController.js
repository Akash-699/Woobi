/**
 * Woobi - Backend Module
 * ApiController.js - Full REST API Endpoints with Security, Authentication & Entitlements
 */

import { API_ROUTES, HTTP_STATUS, ApiContract } from './ApiContract.js';

export class ApiController {
  constructor(router, { security, auth, database, storage }) {
    this.router = router;
    this.security = security;
    this.auth = auth;
    this.db = database;
    this.storage = storage;

    this.setupMiddlewares();
    this.setupRoutes();
  }

  setupMiddlewares() {
    // 1. Security Headers & CORS
    this.router.use((req, res, next) => {
      this.security.applySecurityHeaders(res);
      const preflight = this.security.handleCors(req, res);
      if (preflight) return; // Handled

      // Rate limiting check
      const clientIp = (req.headers && (req.headers['x-forwarded-for'] || req.socket?.remoteAddress)) || '127.0.0.1';
      const rateStatus = this.security.checkRateLimit(clientIp);
      if (!rateStatus.allowed) {
        return this.router.sendJson(res, HTTP_STATUS.TOO_MANY_REQUESTS, ApiContract.createErrorEnvelope('Too many requests. Please slow down.'));
      }

      next();
    });
  }

  requireAuth(req, res) {
    const authResult = this.auth.authenticateRequest(req);
    if (!authResult.authenticated) {
      this.router.sendJson(res, HTTP_STATUS.UNAUTHORIZED, ApiContract.createErrorEnvelope('Unauthorized. Valid Bearer session token required.'));
      return null;
    }
    return authResult.user;
  }

  setupRoutes() {
    // Health Check
    this.router.get(API_ROUTES.HEALTH, (req, res) => {
      this.router.sendJson(res, HTTP_STATUS.OK, {
        status: 'UP',
        service: 'Woobi Modular Monorepo API',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      });
    });

    // ------------------------------------------------------------------------
    // 1. AUTHENTICATION ENDPOINTS
    // ------------------------------------------------------------------------
    this.router.post(API_ROUTES.AUTH_REGISTER, async (req, res) => {
      const body = req.body || {};
      const { email, password, displayName } = body;
      const result = await this.auth.register(email, password, displayName);
      if (!result.success) {
        return this.router.sendJson(res, HTTP_STATUS.BAD_REQUEST, ApiContract.createErrorEnvelope(result.error));
      }
      return this.router.sendJson(res, HTTP_STATUS.CREATED, ApiContract.createSuccessEnvelope(result));
    });

    this.router.post(API_ROUTES.AUTH_LOGIN, async (req, res) => {
      const body = req.body || {};
      const { email, password } = body;
      const result = await this.auth.login(email, password);
      if (!result.success) {
        return this.router.sendJson(res, HTTP_STATUS.UNAUTHORIZED, ApiContract.createErrorEnvelope(result.error));
      }
      return this.router.sendJson(res, HTTP_STATUS.OK, ApiContract.createSuccessEnvelope(result));
    });

    this.router.post(API_ROUTES.AUTH_LOGOUT, async (req, res) => {
      const authUser = this.requireAuth(req, res);
      if (!authUser) return;

      const authHeader = req.headers.authorization || req.headers.Authorization;
      const token = authHeader.slice(7).trim();
      this.auth.revokeToken(token);

      return this.router.sendJson(res, HTTP_STATUS.OK, ApiContract.createSuccessEnvelope({ message: 'Session logged out and revoked' }));
    });

    this.router.get(API_ROUTES.AUTH_ME, async (req, res) => {
      const authUser = this.requireAuth(req, res);
      if (!authUser) return;

      const user = await this.db.users.findById(authUser.userId);
      if (!user) {
        return this.router.sendJson(res, HTTP_STATUS.NOT_FOUND, ApiContract.createErrorEnvelope('User record not found'));
      }
      return this.router.sendJson(res, HTTP_STATUS.OK, ApiContract.createSuccessEnvelope({
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.role
      }));
    });

    // ------------------------------------------------------------------------
    // 2. USER PROFILE ENDPOINTS
    // ------------------------------------------------------------------------
    this.router.get(API_ROUTES.USER_PROFILE, async (req, res) => {
      const authUser = this.requireAuth(req, res);
      if (!authUser) return;

      const user = await this.db.users.findById(authUser.userId);
      if (!user) {
        return this.router.sendJson(res, HTTP_STATUS.NOT_FOUND, ApiContract.createErrorEnvelope('User not found'));
      }
      return this.router.sendJson(res, HTTP_STATUS.OK, ApiContract.createSuccessEnvelope({
        id: user.id,
        email: user.email,
        displayName: user.displayName
      }));
    });

    this.router.put(API_ROUTES.USER_PROFILE, async (req, res) => {
      const authUser = this.requireAuth(req, res);
      if (!authUser) return;

      const body = req.body || {};
      const updates = {};
      if (body.displayName) updates.displayName = this.security.sanitizeString(body.displayName);

      const updated = await this.db.users.update(authUser.userId, updates);
      return this.router.sendJson(res, HTTP_STATUS.OK, ApiContract.createSuccessEnvelope(updated));
    });

    // ------------------------------------------------------------------------
    // 3. SERVER-AUTHORITATIVE SUBSCRIPTION ENTITLEMENTS
    // ------------------------------------------------------------------------
    this.router.get(API_ROUTES.USER_SUBSCRIPTION, async (req, res) => {
      const authUser = this.requireAuth(req, res);
      if (!authUser) return;

      let sub = await this.db.subscriptions.getForUser(authUser.userId);
      if (!sub) {
        sub = await this.db.subscriptions.setEntitlement(authUser.userId, { plan: 'free', isPremium: false });
      }
      return this.router.sendJson(res, HTTP_STATUS.OK, ApiContract.createSuccessEnvelope(sub));
    });

    this.router.post(API_ROUTES.USER_SUBSCRIPTION_VERIFY, async (req, res) => {
      const authUser = this.requireAuth(req, res);
      if (!authUser) return;

      const body = req.body || {};
      const { requestedPlan, devVerificationKey } = body;

      // Anti-tampering check: clients cannot self-grant premium without server verification
      const isFree = requestedPlan === 'free';
      const isDevMode = process.env.NODE_ENV !== 'production';
      const isAllowedDevKey = isDevMode && (devVerificationKey === 'WOOBI_DEV_VERIFIED_UPGRADE' || process.env.ALLOW_DEV_ENTITLEMENT_UPGRADE === 'true');

      if (!isFree && !isAllowedDevKey) {
        return this.router.sendJson(
          res,
          HTTP_STATUS.FORBIDDEN,
          ApiContract.createErrorEnvelope('Unauthorized entitlement upgrade. Self-granting premium access is strictly prohibited. Production upgrades require a verified payment gateway.')
        );
      }

      const isPremium = requestedPlan === 'monthly' || requestedPlan === 'annual' || requestedPlan === 'basic' || requestedPlan === 'pro';
      const entitlement = await this.db.subscriptions.setEntitlement(authUser.userId, {
        plan: requestedPlan || 'free',
        isPremium,
        status: 'active'
      });

      return this.router.sendJson(res, HTTP_STATUS.OK, ApiContract.createSuccessEnvelope(entitlement));
    });

    // ------------------------------------------------------------------------
    // 4. WARDROBE ITEMS (USER-SCOPED)
    // ------------------------------------------------------------------------
    this.router.get(API_ROUTES.WARDROBE_ITEMS, async (req, res) => {
      const authUser = this.requireAuth(req, res);
      if (!authUser) return;

      const items = await this.db.wardrobe.findByUser(authUser.userId);
      return this.router.sendJson(res, HTTP_STATUS.OK, ApiContract.createSuccessEnvelope(items));
    });

    this.router.post(API_ROUTES.WARDROBE_ITEMS, async (req, res) => {
      const authUser = this.requireAuth(req, res);
      if (!authUser) return;

      const body = req.body || {};
      if (!body.name || !body.category) {
        return this.router.sendJson(res, HTTP_STATUS.BAD_REQUEST, ApiContract.createErrorEnvelope('Name and category required'));
      }

      const item = await this.db.wardrobe.create({
        ...body,
        name: this.security.sanitizeString(body.name),
        userId: authUser.userId
      });

      return this.router.sendJson(res, HTTP_STATUS.CREATED, ApiContract.createSuccessEnvelope(item));
    });

    this.router.delete(API_ROUTES.WARDROBE_ITEM_DETAIL, async (req, res) => {
      const authUser = this.requireAuth(req, res);
      if (!authUser) return;

      const itemId = req.params.id;
      const success = await this.db.wardrobe.deleteForUser(itemId, authUser.userId);
      if (!success) {
        return this.router.sendJson(res, HTTP_STATUS.NOT_FOUND, ApiContract.createErrorEnvelope('Item not found or unauthorized'));
      }
      return this.router.sendJson(res, HTTP_STATUS.OK, ApiContract.createSuccessEnvelope({ deleted: true, id: itemId }));
    });

    // ------------------------------------------------------------------------
    // 5. SAVED LOOKS (USER-SCOPED)
    // ------------------------------------------------------------------------
    this.router.get(API_ROUTES.SAVED_LOOKS, async (req, res) => {
      const authUser = this.requireAuth(req, res);
      if (!authUser) return;

      const looks = await this.db.looks.findByUser(authUser.userId);
      return this.router.sendJson(res, HTTP_STATUS.OK, ApiContract.createSuccessEnvelope(looks));
    });

    this.router.post(API_ROUTES.SAVED_LOOKS, async (req, res) => {
      const authUser = this.requireAuth(req, res);
      if (!authUser) return;

      const body = req.body || {};
      const look = await this.db.looks.create({
        ...body,
        name: this.security.sanitizeString(body.name || 'Untitled Look'),
        userId: authUser.userId
      });

      return this.router.sendJson(res, HTTP_STATUS.CREATED, ApiContract.createSuccessEnvelope(look));
    });

    this.router.delete(API_ROUTES.SAVED_LOOK_DETAIL, async (req, res) => {
      const authUser = this.requireAuth(req, res);
      if (!authUser) return;

      const lookId = req.params.id;
      const success = await this.db.looks.deleteForUser(lookId, authUser.userId);
      if (!success) {
        return this.router.sendJson(res, HTTP_STATUS.NOT_FOUND, ApiContract.createErrorEnvelope('Look not found or unauthorized'));
      }
      return this.router.sendJson(res, HTTP_STATUS.OK, ApiContract.createSuccessEnvelope({ deleted: true, id: lookId }));
    });

    // ------------------------------------------------------------------------
    // 6. AVATAR PREFERENCES
    // ------------------------------------------------------------------------
    this.router.get(API_ROUTES.AVATAR_PREFERENCES, async (req, res) => {
      const authUser = this.requireAuth(req, res);
      if (!authUser) return;

      const avatar = await this.db.avatar.getForUser(authUser.userId);
      return this.router.sendJson(res, HTTP_STATUS.OK, ApiContract.createSuccessEnvelope(avatar || {}));
    });

    this.router.put(API_ROUTES.AVATAR_PREFERENCES, async (req, res) => {
      const authUser = this.requireAuth(req, res);
      if (!authUser) return;

      const body = req.body || {};
      const saved = await this.db.avatar.saveForUser(authUser.userId, body);
      return this.router.sendJson(res, HTTP_STATUS.OK, ApiContract.createSuccessEnvelope(saved));
    });

    // ------------------------------------------------------------------------
    // 7. USER APPLICATION SETTINGS
    // ------------------------------------------------------------------------
    this.router.get(API_ROUTES.USER_SETTINGS, async (req, res) => {
      const authUser = this.requireAuth(req, res);
      if (!authUser) return;

      const settings = await this.db.settings.getForUser(authUser.userId);
      return this.router.sendJson(res, HTTP_STATUS.OK, ApiContract.createSuccessEnvelope(settings || {}));
    });

    this.router.put(API_ROUTES.USER_SETTINGS, async (req, res) => {
      const authUser = this.requireAuth(req, res);
      if (!authUser) return;

      const body = req.body || {};
      const saved = await this.db.settings.saveForUser(authUser.userId, body);
      return this.router.sendJson(res, HTTP_STATUS.OK, ApiContract.createSuccessEnvelope(saved));
    });

    // ------------------------------------------------------------------------
    // 8. DAILY STREAK
    // ------------------------------------------------------------------------
    this.router.get(API_ROUTES.STREAK_STATUS, async (req, res) => {
      const authUser = this.requireAuth(req, res);
      if (!authUser) return;

      const record = await this.db.streak.getForUser(authUser.userId);
      return this.router.sendJson(res, HTTP_STATUS.OK, ApiContract.createSuccessEnvelope(record || { currentStreak: 0, bestStreak: 0 }));
    });

    this.router.post(API_ROUTES.STREAK_RECORD, async (req, res) => {
      const authUser = this.requireAuth(req, res);
      if (!authUser) return;

      const record = await this.db.streak.recordStreak(authUser.userId);
      return this.router.sendJson(res, HTTP_STATUS.OK, ApiContract.createSuccessEnvelope(record));
    });

    // ------------------------------------------------------------------------
    // 9. STORAGE & MEDIA UPLOADS
    // ------------------------------------------------------------------------
    this.router.post(API_ROUTES.STORAGE_UPLOAD, async (req, res) => {
      const authUser = this.requireAuth(req, res);
      if (!authUser) return;

      let buffer = null;
      let filename = 'upload.png';

      if (Buffer.isBuffer(req.body)) {
        buffer = req.body;
      } else if (req.body && typeof req.body === 'object' && req.body.data) {
        // Base64 dataURL fallback
        const base64Data = req.body.data.replace(/^data:image\/\w+;base64,/, '');
        buffer = Buffer.from(base64Data, 'base64');
        if (req.body.filename) filename = req.body.filename;
      }

      if (!buffer) {
        return this.router.sendJson(res, HTTP_STATUS.BAD_REQUEST, ApiContract.createErrorEnvelope('Binary or base64 image data required'));
      }

      const saveRes = await this.storage.saveUserFile(authUser.userId, filename, buffer);
      if (!saveRes.success) {
        return this.router.sendJson(res, HTTP_STATUS.BAD_REQUEST, ApiContract.createErrorEnvelope(saveRes.error));
      }

      return this.router.sendJson(res, HTTP_STATUS.CREATED, ApiContract.createSuccessEnvelope(saveRes.file));
    });

    this.router.get(API_ROUTES.STORAGE_FILE, async (req, res) => {
      const authUser = this.requireAuth(req, res);
      if (!authUser) return;

      const filename = req.params.filename;
      const fileRes = await this.storage.getFile(authUser.userId, filename);
      if (!fileRes.found) {
        return this.router.sendJson(res, HTTP_STATUS.NOT_FOUND, ApiContract.createErrorEnvelope('File not found or unauthorized'));
      }

      res.writeHead(HTTP_STATUS.OK, {
        'Content-Type': fileRes.mimeType,
        'Cache-Control': 'private, max-age=3600'
      });
      return res.end(fileRes.buffer);
    });
  }
}

export function createApiController(router, services) {
  return new ApiController(router, services);
}

export default ApiController;
