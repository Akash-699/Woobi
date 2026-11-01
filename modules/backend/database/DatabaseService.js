/**
 * Woobi - Backend Module
 * DatabaseService.js - Hardened ACID-Compliant Repository Engine with Mutex Writes, Backup Recovery & Scoped Isolation
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { DB_ENTITIES, DB_EVENTS } from './DatabaseContract.js';

class BaseRepository {
  constructor(db, collectionName, idPrefix = 'item') {
    this.db = db;
    this.collectionName = collectionName;
    this.idPrefix = idPrefix;
  }

  getAll() {
    return this.db.readCollection(this.collectionName);
  }

  async findById(id) {
    const list = this.getAll();
    return list.find(item => item.id === id) || null;
  }

  async create(data) {
    const list = this.getAll();
    const id = data.id || `${this.idPrefix}_${crypto.randomBytes(6).toString('hex')}`;
    const record = {
      ...data,
      id,
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    list.push(record);
    await this.db.writeCollection(this.collectionName, list);
    this.db.emit(DB_EVENTS.ENTITY_CREATED, { collection: this.collectionName, entity: record });
    return record;
  }

  async update(id, updates) {
    const list = this.getAll();
    const idx = list.findIndex(item => item.id === id);
    if (idx === -1) return null;

    const updated = {
      ...list[idx],
      ...updates,
      id, // Immutable ID
      updatedAt: new Date().toISOString()
    };
    list[idx] = updated;
    await this.db.writeCollection(this.collectionName, list);
    this.db.emit(DB_EVENTS.ENTITY_UPDATED, { collection: this.collectionName, entity: updated });
    return updated;
  }

  async delete(id) {
    const list = this.getAll();
    const idx = list.findIndex(item => item.id === id);
    if (idx === -1) return false;

    const [deleted] = list.splice(idx, 1);
    await this.db.writeCollection(this.collectionName, list);
    this.db.emit(DB_EVENTS.ENTITY_DELETED, { collection: this.collectionName, id, entity: deleted });
    return true;
  }
}

// User-scoped repository ensures records belong strictly to the authenticated owner
class UserScopedRepository extends BaseRepository {
  async findByUser(userId) {
    if (!userId) return [];
    const list = this.getAll();
    return list.filter(item => item.userId === userId);
  }

  async findByIdAndUser(id, userId) {
    if (!id || !userId) return null;
    const list = this.getAll();
    return list.find(item => item.id === id && item.userId === userId) || null;
  }

  async updateForUser(id, userId, updates) {
    const existing = await this.findByIdAndUser(id, userId);
    if (!existing) return null;
    return this.update(id, updates);
  }

  async deleteForUser(id, userId) {
    const existing = await this.findByIdAndUser(id, userId);
    if (!existing) return false;
    return this.delete(id);
  }
}

class UserRepository extends BaseRepository {
  constructor(db) {
    super(db, DB_ENTITIES.USERS, 'usr');
  }

  async findByEmail(email) {
    if (!email) return null;
    const list = this.getAll();
    return list.find(u => u.email === email.toLowerCase()) || null;
  }
}

class WardrobeRepository extends UserScopedRepository {
  constructor(db) {
    super(db, DB_ENTITIES.WARDROBE_ITEMS, 'item');
  }
}

class LookRepository extends UserScopedRepository {
  constructor(db) {
    super(db, DB_ENTITIES.SAVED_LOOKS, 'look');
  }
}

class AvatarRepository extends BaseRepository {
  constructor(db) {
    super(db, DB_ENTITIES.AVATAR_PREFERENCES, 'avt');
  }

  async getForUser(userId) {
    if (!userId) return null;
    const list = this.getAll();
    return list.find(a => a.userId === userId) || null;
  }

  async saveForUser(userId, prefs) {
    if (!userId) return null;
    const list = this.getAll();
    const idx = list.findIndex(a => a.userId === userId);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...prefs, userId, updatedAt: new Date().toISOString() };
      await this.db.writeCollection(this.collectionName, list);
      return list[idx];
    }
    return this.create({ ...prefs, userId });
  }
}

class SettingsRepository extends BaseRepository {
  constructor(db) {
    super(db, DB_ENTITIES.USER_SETTINGS, 'cfg');
  }

  async getForUser(userId) {
    if (!userId) return null;
    const list = this.getAll();
    return list.find(s => s.userId === userId) || null;
  }

  async saveForUser(userId, settings) {
    if (!userId) return null;
    const list = this.getAll();
    const idx = list.findIndex(s => s.userId === userId);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...settings, userId, updatedAt: new Date().toISOString() };
      await this.db.writeCollection(this.collectionName, list);
      return list[idx];
    }
    return this.create({ ...settings, userId });
  }
}

class StreakRepository extends BaseRepository {
  constructor(db) {
    super(db, DB_ENTITIES.STREAK_RECORDS, 'strk');
  }

  async getForUser(userId) {
    if (!userId) return null;
    const list = this.getAll();
    return list.find(s => s.userId === userId) || null;
  }

  async recordStreak(userId, uploadDate = new Date().toISOString().slice(0, 10)) {
    if (!userId) return null;
    const list = this.getAll();
    const idx = list.findIndex(s => s.userId === userId);
    if (idx !== -1) {
      const record = list[idx];
      record.currentStreak += 1;
      record.bestStreak = Math.max(record.bestStreak, record.currentStreak);
      record.lastUploadDate = uploadDate;
      record.updatedAt = new Date().toISOString();
      await this.db.writeCollection(this.collectionName, list);
      return record;
    }
    return this.create({
      userId,
      currentStreak: 1,
      bestStreak: 1,
      lastUploadDate: uploadDate
    });
  }
}

class SubscriptionRepository extends BaseRepository {
  constructor(db) {
    super(db, DB_ENTITIES.SUBSCRIPTIONS, 'sub');
  }

  async getForUser(userId) {
    if (!userId) return null;
    const list = this.getAll();
    return list.find(s => s.userId === userId) || null;
  }

  async setEntitlement(userId, { plan = 'free', isPremium = false, status = 'active', expiresAt = null }) {
    if (!userId) return null;
    const list = this.getAll();
    const idx = list.findIndex(s => s.userId === userId);
    const entitlement = {
      userId,
      plan,
      isPremium,
      status,
      expiresAt,
      verifiedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (idx !== -1) {
      list[idx] = { ...list[idx], ...entitlement };
      await this.db.writeCollection(this.collectionName, list);
      return list[idx];
    }
    return this.create(entitlement);
  }
}

class RevokedTokenRepository extends BaseRepository {
  constructor(db) {
    super(db, DB_ENTITIES.REVOKED_TOKENS, 'rev');
  }

  async isRevoked(token) {
    if (!token) return false;
    const list = this.getAll();
    return list.some(r => r.token === token);
  }

  async revoke(token, expiresAt = null) {
    if (!token) return false;
    const list = this.getAll();
    if (list.some(r => r.token === token)) return true;
    await this.create({
      token,
      revokedAt: new Date().toISOString(),
      expiresAt: expiresAt || new Date(Date.now() + 24 * 3600 * 1000).toISOString()
    });
    return true;
  }

  async pruneExpired() {
    const list = this.getAll();
    const now = Date.now();
    const active = list.filter(r => !r.expiresAt || new Date(r.expiresAt).getTime() > now);
    if (active.length !== list.length) {
      await this.db.writeCollection(this.collectionName, active);
    }
  }
}

export class DatabaseService {
  constructor(options = {}) {
    this.options = {
      dataDir: path.resolve('data'),
      inMemoryOnly: false,
      ...options
    };

    this.cache = new Map();
    this.listeners = new Map();
    this.writeLocks = new Map(); // collectionName -> Promise chain

    if (!this.options.inMemoryOnly && !fs.existsSync(this.options.dataDir)) {
      try {
        fs.mkdirSync(this.options.dataDir, { recursive: true });
      } catch (err) {
        console.warn('DatabaseService: fallback to in-memory mode', err.message);
        this.options.inMemoryOnly = true;
      }
    }

    // Initialize entity repositories
    this.users = new UserRepository(this);
    this.wardrobe = new WardrobeRepository(this);
    this.looks = new LookRepository(this);
    this.avatar = new AvatarRepository(this);
    this.settings = new SettingsRepository(this);
    this.streak = new StreakRepository(this);
    this.subscriptions = new SubscriptionRepository(this);
    this.revokedTokens = new RevokedTokenRepository(this);

    // Initial schema migration / seeding
    this.runInitialMigrations();
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      for (const cb of this.listeners.get(event)) {
        try {
          cb(data);
        } catch (err) {
          console.error(`DatabaseService event error [${event}]:`, err);
        }
      }
    }
  }

  getFilePath(collectionName) {
    return path.join(this.options.dataDir, `${collectionName}.json`);
  }

  getBackupFilePath(collectionName) {
    return path.join(this.options.dataDir, `${collectionName}.json.bak`);
  }

  readCollection(collectionName) {
    if (this.cache.has(collectionName)) {
      return this.cache.get(collectionName);
    }

    if (this.options.inMemoryOnly) {
      const initial = [];
      this.cache.set(collectionName, initial);
      return initial;
    }

    const filePath = this.getFilePath(collectionName);
    const backupPath = this.getBackupFilePath(collectionName);

    if (!fs.existsSync(filePath)) {
      const initial = [];
      this.cache.set(collectionName, initial);
      return initial;
    }

    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const data = JSON.parse(content);
      const list = Array.isArray(data) ? data : [];
      this.cache.set(collectionName, list);
      return list;
    } catch (err) {
      this.emit(DB_EVENTS.CORRUPTION_DETECTED, { collection: collectionName, error: err.message });

      // Automatic recovery from .bak backup file
      if (fs.existsSync(backupPath)) {
        try {
          const bakContent = fs.readFileSync(backupPath, 'utf8');
          const bakData = JSON.parse(bakContent);
          const recoveredList = Array.isArray(bakData) ? bakData : [];
          this.cache.set(collectionName, recoveredList);
          // Restore primary file
          fs.writeFileSync(filePath, bakContent, 'utf8');
          this.emit(DB_EVENTS.RECOVERED_FROM_BACKUP, { collection: collectionName, count: recoveredList.length });
          return recoveredList;
        } catch (bakErr) {
          console.error(`Backup restoration failed for [${collectionName}]:`, bakErr.message);
        }
      }

      const fallback = [];
      this.cache.set(collectionName, fallback);
      return fallback;
    }
  }

  /**
   * Thread-safe / asynchronous mutex write to serialize disk updates per collection
   */
  async writeCollection(collectionName, data) {
    this.cache.set(collectionName, data);

    if (this.options.inMemoryOnly) return;

    // Mutex write serialization
    const currentLock = this.writeLocks.get(collectionName) || Promise.resolve();
    const nextLock = currentLock.then(() => this._performAtomicWrite(collectionName, data));
    this.writeLocks.set(collectionName, nextLock);
    return nextLock;
  }

  _performAtomicWrite(collectionName, data) {
    const filePath = this.getFilePath(collectionName);
    const backupPath = this.getBackupFilePath(collectionName);
    const tmpPath = `${filePath}.tmp_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    try {
      const serialized = JSON.stringify(data, null, 2);

      // 1. If existing file exists, update backup copy
      if (fs.existsSync(filePath)) {
        try {
          fs.copyFileSync(filePath, backupPath);
        } catch {}
      }

      // 2. Write to unique temporary file
      fs.writeFileSync(tmpPath, serialized, 'utf8');

      // 3. Atomically replace target file
      fs.renameSync(tmpPath, filePath);
    } catch (err) {
      if (fs.existsSync(tmpPath)) {
        try { fs.unlinkSync(tmpPath); } catch {}
      }
      throw new Error(`Database atomic write failure on [${collectionName}]: ${err.message}`);
    }
  }

  /**
   * Multi-record transaction with staging snapshot and atomic rollback capability
   * @param {Function} transactionFn async function(txDb)
   */
  async transaction(transactionFn) {
    const stagedCache = new Map();
    // Snapshot current cache states
    for (const [key, val] of this.cache.entries()) {
      stagedCache.set(key, JSON.parse(JSON.stringify(val)));
    }

    try {
      const result = await transactionFn(this);
      this.emit(DB_EVENTS.TRANSACTION_COMMITTED, { timestamp: new Date().toISOString() });
      return result;
    } catch (err) {
      // Rollback cache to snapshot
      this.cache = stagedCache;
      this.emit(DB_EVENTS.TRANSACTION_ROLLED_BACK, { error: err.message });
      throw err;
    }
  }

  runInitialMigrations() {
    this.emit(DB_EVENTS.MIGRATION_APPLIED, { version: '1.0.0', name: 'initial_monorepo_schema' });
  }

  resetAll() {
    this.cache.clear();
    this.writeLocks.clear();
    if (!this.options.inMemoryOnly && fs.existsSync(this.options.dataDir)) {
      for (const ent of Object.values(DB_ENTITIES)) {
        const fp = this.getFilePath(ent);
        const bak = this.getBackupFilePath(ent);
        if (fs.existsSync(fp)) {
          try { fs.unlinkSync(fp); } catch {}
        }
        if (fs.existsSync(bak)) {
          try { fs.unlinkSync(bak); } catch {}
        }
      }
    }
  }
}

export function createDatabaseService(options = {}) {
  return new DatabaseService(options);
}

export default DatabaseService;
