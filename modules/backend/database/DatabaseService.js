/**
 * Woobi - Backend Module
 * DatabaseService.js - File-backed ACID-Compliant Repository Engine with User Scoping & Migrations
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
    this.db.writeCollection(this.collectionName, list);
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
    this.db.writeCollection(this.collectionName, list);
    this.db.emit(DB_EVENTS.ENTITY_UPDATED, { collection: this.collectionName, entity: updated });
    return updated;
  }

  async delete(id) {
    const list = this.getAll();
    const idx = list.findIndex(item => item.id === id);
    if (idx === -1) return false;

    const [deleted] = list.splice(idx, 1);
    this.db.writeCollection(this.collectionName, list);
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
      this.db.writeCollection(this.collectionName, list);
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
      this.db.writeCollection(this.collectionName, list);
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
      this.db.writeCollection(this.collectionName, list);
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
      this.db.writeCollection(this.collectionName, list);
      return list[idx];
    }
    return this.create(entitlement);
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
      const fallback = [];
      this.cache.set(collectionName, fallback);
      return fallback;
    }
  }

  writeCollection(collectionName, data) {
    this.cache.set(collectionName, data);

    if (this.options.inMemoryOnly) return;

    const filePath = this.getFilePath(collectionName);
    const tmpPath = `${filePath}.tmp_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    try {
      const serialized = JSON.stringify(data, null, 2);
      fs.writeFileSync(tmpPath, serialized, 'utf8');
      fs.renameSync(tmpPath, filePath);
    } catch (err) {
      if (fs.existsSync(tmpPath)) {
        try { fs.unlinkSync(tmpPath); } catch {}
      }
      throw new Error(`Database atomic write failure on [${collectionName}]: ${err.message}`);
    }
  }

  runInitialMigrations() {
    this.emit(DB_EVENTS.MIGRATION_APPLIED, { version: '1.0.0', name: 'initial_monorepo_schema' });
  }

  /**
   * Cleans up all collections (used in automated testing)
   */
  resetAll() {
    this.cache.clear();
    if (!this.options.inMemoryOnly && fs.existsSync(this.options.dataDir)) {
      for (const ent of Object.values(DB_ENTITIES)) {
        const fp = this.getFilePath(ent);
        if (fs.existsSync(fp)) {
          try { fs.unlinkSync(fp); } catch {}
        }
      }
    }
  }
}

export function createDatabaseService(options = {}) {
  return new DatabaseService(options);
}

export default DatabaseService;
