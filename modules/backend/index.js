/**
 * Woobi - Backend Module
 * index.js - Unified Public Interface, Service Orchestrator & Client API SDK
 */

import { SecurityService, createSecurityService, SECURITY_POLICIES, SECURITY_EVENTS, SecurityContract } from './security/index.js';
import { AuthService, createAuthService, AUTH_CONFIG, AUTH_ROLES, AUTH_EVENTS, AuthContract } from './auth/index.js';
import { DatabaseService, createDatabaseService, DB_ENTITIES, DB_EVENTS, DatabaseContract } from './database/index.js';
import { StorageService, createStorageService, STORAGE_CONSTRAINTS, STORAGE_EVENTS, StorageContract } from './storage/index.js';
import { Router, createRouter, ApiController, createApiController, API_ROUTES, HTTP_STATUS, ApiContract } from './api/index.js';

export {
  // Security
  SecurityService,
  createSecurityService,
  SECURITY_POLICIES,
  SECURITY_EVENTS,
  SecurityContract,

  // Auth
  AuthService,
  createAuthService,
  AUTH_CONFIG,
  AUTH_ROLES,
  AUTH_EVENTS,
  AuthContract,

  // Database
  DatabaseService,
  createDatabaseService,
  DB_ENTITIES,
  DB_EVENTS,
  DatabaseContract,

  // Storage
  StorageService,
  createStorageService,
  STORAGE_CONSTRAINTS,
  STORAGE_EVENTS,
  StorageContract,

  // API
  Router,
  createRouter,
  ApiController,
  createApiController,
  API_ROUTES,
  HTTP_STATUS,
  ApiContract
};

/**
 * Top-Level Backend Service Orchestrator
 * Integrates Security, Authentication, Database, Storage, and API Routing
 */
export class BackendService {
  constructor(options = {}) {
    this.options = options;

    // 1. Security Service
    this.security = createSecurityService(options.security || {});

    // 2. Database Service
    this.db = createDatabaseService(options.database || {});

    // 3. Authentication Service
    this.auth = createAuthService(this.db, options.auth || {});

    // 4. Storage Service
    this.storage = createStorageService(options.storage || {});

    // 5. REST Router & Controller
    this.router = createRouter();
    this.controller = createApiController(this.router, {
      security: this.security,
      auth: this.auth,
      database: this.db,
      storage: this.storage
    });
  }

  /**
   * Main HTTP request dispatcher
   * @param {object} req Incoming HTTP request
   * @param {object} res Outgoing HTTP response
   * @returns {Promise<boolean>} True if handled by API, false if unhandled (e.g. static file)
   */
  async handleRequest(req, res) {
    return this.router.handle(req, res);
  }

  /**
   * Cleans up all collections and caches (testing utility)
   */
  resetAll() {
    this.db.resetAll();
    this.auth.revokedTokens.clear();
    this.security.rateLimitBuckets.clear();
  }
}

export function createBackendService(options = {}) {
  return new BackendService(options);
}

/**
 * Browser-Safe HTTP Client API SDK
 * Communicates with backend strictly over fetch() without importing server internals
 */
export class ApiClient {
  constructor(baseUrl = '', options = {}) {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
    this.token = options.token || (typeof localStorage !== 'undefined' ? localStorage.getItem('woobi_auth_session') : null);
    this.fetchFn = options.fetchFn || (typeof fetch !== 'undefined' ? fetch.bind(globalThis) : null);
  }

  setToken(token) {
    this.token = token;
    if (typeof localStorage !== 'undefined') {
      if (token) localStorage.setItem('woobi_auth_session', token);
      else localStorage.removeItem('woobi_auth_session');
    }
  }

  getToken() {
    return this.token;
  }

  clearToken() {
    this.setToken(null);
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(options.headers || {})
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    if (!this.fetchFn) {
      return { success: false, error: 'Fetch client not available in current runtime', offline: true };
    }

    try {
      const response = await this.fetchFn(url, {
        method: options.method || 'GET',
        headers,
        body: options.body ? (typeof options.body === 'string' ? options.body : JSON.stringify(options.body)) : undefined
      });

      const contentType = response.headers.get('content-type') || '';
      let data = null;
      if (contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      return {
        ok: response.ok,
        status: response.status,
        ...(typeof data === 'object' && data !== null ? data : { data })
      };
    } catch (err) {
      return {
        success: false,
        error: `Network request failed: ${err.message}`,
        offline: true
      };
    }
  }

  // API Methods
  async health() { return this.request(API_ROUTES.HEALTH); }
  async register(email, password, displayName) {
    const res = await this.request(API_ROUTES.AUTH_REGISTER, {
      method: 'POST',
      body: { email, password, displayName }
    });
    if (res.success && res.data?.token) {
      this.setToken(res.data.token);
    }
    return res;
  }

  async login(email, password) {
    const res = await this.request(API_ROUTES.AUTH_LOGIN, {
      method: 'POST',
      body: { email, password }
    });
    if (res.success && res.data?.token) {
      this.setToken(res.data.token);
    }
    return res;
  }

  async logout() {
    const res = await this.request(API_ROUTES.AUTH_LOGOUT, { method: 'POST' });
    this.clearToken();
    return res;
  }

  async getProfile() { return this.request(API_ROUTES.USER_PROFILE); }
  async updateProfile(updates) { return this.request(API_ROUTES.USER_PROFILE, { method: 'PUT', body: updates }); }

  async getSubscription() { return this.request(API_ROUTES.USER_SUBSCRIPTION); }
  async verifySubscription(requestedPlan, devVerificationKey) {
    return this.request(API_ROUTES.USER_SUBSCRIPTION_VERIFY, {
      method: 'POST',
      body: { requestedPlan, devVerificationKey }
    });
  }

  async getWardrobeItems() { return this.request(API_ROUTES.WARDROBE_ITEMS); }
  async createWardrobeItem(item) { return this.request(API_ROUTES.WARDROBE_ITEMS, { method: 'POST', body: item }); }
  async deleteWardrobeItem(id) { return this.request(`/api/wardrobe/items/${id}`, { method: 'DELETE' }); }

  async getSavedLooks() { return this.request(API_ROUTES.SAVED_LOOKS); }
  async createSavedLook(look) { return this.request(API_ROUTES.SAVED_LOOKS, { method: 'POST', body: look }); }
  async deleteSavedLook(id) { return this.request(`/api/looks/${id}`, { method: 'DELETE' }); }

  async getAvatarPreferences() { return this.request(API_ROUTES.AVATAR_PREFERENCES); }
  async saveAvatarPreferences(prefs) { return this.request(API_ROUTES.AVATAR_PREFERENCES, { method: 'PUT', body: prefs }); }

  async getUserSettings() { return this.request(API_ROUTES.USER_SETTINGS); }
  async saveUserSettings(settings) { return this.request(API_ROUTES.USER_SETTINGS, { method: 'PUT', body: settings }); }

  async getStreak() { return this.request(API_ROUTES.STREAK_STATUS); }
  async recordStreak() { return this.request(API_ROUTES.STREAK_RECORD, { method: 'POST' }); }

  async uploadImage(dataUrlOrBuffer, filename = 'photo.png') {
    return this.request(API_ROUTES.STORAGE_UPLOAD, {
      method: 'POST',
      body: { data: dataUrlOrBuffer, filename }
    });
  }
}

export function createApiClient(baseUrl = '', options = {}) {
  return new ApiClient(baseUrl, options);
}

// Backward-compatible BackendContract export
export const BackendContract = {
  endpoints: API_ROUTES,
  healthCheck: () => ({
    status: 'UP',
    version: '1.0.0',
    timestamp: Date.now()
  }),
  createService: createBackendService,
  createClient: createApiClient
};

if (typeof window !== 'undefined') {
  window.WoobiBackend = {
    BackendContract,
    ApiClient,
    createApiClient,
    API_ROUTES
  };
}

export default BackendContract;
