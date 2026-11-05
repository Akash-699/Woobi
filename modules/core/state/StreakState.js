/**
 * Woobi Core State - StreakState
 * Authoritative manager for Daily Outfit Streaks, Outfit Memories,
 * Consecutive Streak Calculation, and Monthly Fire/Smoke Calendar.
 */

export const STREAK_EVENTS = {
  UPDATED: 'streak:updated',
  BROKEN: 'streak:broken',
  RESTORED: 'streak:restored',
  RESET: 'streak:reset',
  MEMORY_ADDED: 'memory:added'
};

export const TEST_USER_ID = 'test_user_136';

export const STREAK_STORAGE_KEYS = {
  STATE: 'woobi_outfit_streak_v2',
  MEMORIES: 'woobi_outfit_memories_v1',
  LEGACY: 'aura_outfit_streak'
};

export class StreakState {
  constructor(options = {}) {
    this.options = Object.assign({
      storageKey: STREAK_STORAGE_KEYS.STATE,
      memoriesKey: STREAK_STORAGE_KEYS.MEMORIES,
      deadlineDurationMs: 24 * 3600 * 1000
    }, options);

    this.listeners = new Map();
    this._memoryStore = new Map();

    // Default clean initial state for brand new user
    this.state = {
      currentStreak: 0,
      bestStreak: 0,
      savedPreviousStreak: 0,
      isStreakBroken: false,
      deadline: Date.now() + this.options.deadlineDurationMs,
      lastUploadTimestamp: null,
      lastUploadDateStr: null,
      lastRestoredCycleKey: null,
      hasEarnedStreak: false,
      uploadedToday: false,
      morningReminderSent: false,
      urgentReminderSent: false
    };

    this.memories = [];

    this._loadFromStorage();
    this._checkDailyStatus();
  }

  // ---------------------------------------------------------------------------
  // Date Helpers
  // ---------------------------------------------------------------------------
  formatDateKey(date = new Date()) {
    const d = new Date(date);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  getYesterdayDateKey(date = new Date()) {
    const d = new Date(date);
    d.setDate(d.getDate() - 1);
    return this.formatDateKey(d);
  }

  getMonthlyRestoreCycleKey(date = new Date()) {
    const d = new Date(date);
    const y = d.getFullYear();
    const m = d.getMonth();
    const day = d.getDate();
    // Cycles refresh on the 3rd of each month
    if (day < 3) {
      const prev = new Date(y, m - 1, 1);
      return `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`;
    }
    return `${y}-${String(m + 1).padStart(2, '0')}`;
  }

  getNextRestoreRefreshDateStr(date = new Date()) {
    const d = new Date(date);
    const y = d.getFullYear();
    const m = d.getMonth();
    const day = d.getDate();
    let target = day < 3 ? new Date(y, m, 3) : new Date(y, m + 1, 3);
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${monthNames[target.getMonth()]} 3, ${target.getFullYear()}`;
  }

  // ---------------------------------------------------------------------------
  // Persistence & User Scoping
  // ---------------------------------------------------------------------------
  setUserId(userId) {
    if (!userId || typeof userId !== 'string') return;
    this.userId = userId;
    this.options.storageKey = `woobi_outfit_streak_${userId}`;
    this.options.memoriesKey = `woobi_outfit_memories_${userId}`;

    // Reset to clean user baseline
    this.state = {
      currentStreak: 0,
      bestStreak: 0,
      savedPreviousStreak: 0,
      isStreakBroken: false,
      deadline: Date.now() + this.options.deadlineDurationMs,
      lastUploadTimestamp: null,
      lastUploadDateStr: null,
      lastRestoredCycleKey: null,
      hasEarnedStreak: false,
      uploadedToday: false,
      morningReminderSent: false,
      urgentReminderSent: false
    };
    this.memories = [];

    this._loadFromStorage();
    this._checkDailyStatus();
  }

  _loadFromStorage() {
    if (this.options.storageKey === null || this.options.memoriesKey === null) {
      // Ephemeral test mode - preserve pristine state for isolated unit testing
      return;
    }

    let rawState = null;
    let rawMemories = null;

    if (typeof localStorage !== 'undefined') {
      try {
        rawState = localStorage.getItem(this.options.storageKey) ||
                   localStorage.getItem(STREAK_STORAGE_KEYS.LEGACY);
        rawMemories = localStorage.getItem(this.options.memoriesKey);
      } catch (e) {
        console.warn('[StreakState] Could not read localStorage:', e);
      }
    } else if (this._memoryStore) {
      rawState = this._memoryStore.get(this.options.storageKey);
      rawMemories = this._memoryStore.get(this.options.memoriesKey);
    }

    if (rawState) {
      try {
        const parsed = JSON.parse(rawState);
        if (parsed && typeof parsed === 'object') {
          this.state = Object.assign(this.state, parsed);
        }
      } catch (e) {
        console.warn('[StreakState] Could not parse stored state:', e);
      }
    }

    if (rawMemories) {
      try {
        const parsed = JSON.parse(rawMemories);
        if (Array.isArray(parsed)) {
          this.memories = parsed;
        }
      } catch (e) {
        console.warn('[StreakState] Could not parse stored memories:', e);
      }
    } else if (this.userId === TEST_USER_ID) {
      // Seed isolated 136-day streak test data for test user
      this.seedTestUserStreak136();
    }
  }

  // ---------------------------------------------------------------------------
  // Test User & Isolation System (136-Day Preview Mode)
  // ---------------------------------------------------------------------------
  isTestUser() {
    return this.userId === TEST_USER_ID || Boolean(this.state.isTestUser);
  }

  loadTestUserStreak136() {
    this.setUserId(TEST_USER_ID);
    if (!this.memories || this.memories.length < 136 || this.state.currentStreak !== 136) {
      this.seedTestUserStreak136();
    }
    this.state.isTestUser = true;
    this.state.isTestData = true;
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('woobi_streak_user_mode', 'test');
      } catch (e) {}
    }
    this._emit(STREAK_EVENTS.UPDATED, this.getStatus());
    return this.getStatus();
  }

  resetTestData() {
    this.setUserId(TEST_USER_ID);
    return this.seedTestUserStreak136();
  }

  clearTestData() {
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.removeItem(`woobi_outfit_streak_${TEST_USER_ID}`);
        localStorage.removeItem(`woobi_outfit_memories_${TEST_USER_ID}`);
        localStorage.removeItem('woobi_streak_user_mode');
      } catch (e) {}
    }
    if (this._memoryStore) {
      this._memoryStore.delete(`woobi_outfit_streak_${TEST_USER_ID}`);
      this._memoryStore.delete(`woobi_outfit_memories_${TEST_USER_ID}`);
    }
    if (this.userId === TEST_USER_ID) {
      this.state = {
        currentStreak: 0,
        bestStreak: 0,
        savedPreviousStreak: 0,
        isStreakBroken: false,
        deadline: Date.now() + this.options.deadlineDurationMs,
        lastUploadTimestamp: null,
        lastUploadDateStr: null,
        lastRestoredCycleKey: null,
        hasEarnedStreak: false,
        uploadedToday: false,
        morningReminderSent: false,
        urgentReminderSent: false,
        isTestUser: false,
        isTestData: false
      };
      this.memories = [];
      this.userId = null;
      this.options.storageKey = STREAK_STORAGE_KEYS.STATE;
      this.options.memoriesKey = STREAK_STORAGE_KEYS.MEMORIES;
    }
    this._emit(STREAK_EVENTS.RESET, { streak: 0 });
    return { success: true };
  }

  switchToRealUser(realUserId = null) {
    this.userId = realUserId;
    this.options.storageKey = realUserId ? `woobi_outfit_streak_${realUserId}` : STREAK_STORAGE_KEYS.STATE;
    this.options.memoriesKey = realUserId ? `woobi_outfit_memories_${realUserId}` : STREAK_STORAGE_KEYS.MEMORIES;
    this.state = {
      currentStreak: 0,
      bestStreak: 0,
      savedPreviousStreak: 0,
      isStreakBroken: false,
      deadline: Date.now() + this.options.deadlineDurationMs,
      lastUploadTimestamp: null,
      lastUploadDateStr: null,
      lastRestoredCycleKey: null,
      hasEarnedStreak: false,
      uploadedToday: false,
      morningReminderSent: false,
      urgentReminderSent: false,
      isTestUser: false,
      isTestData: false
    };
    this.memories = [];
    this._loadFromStorage();
    this._checkDailyStatus();
    this.state.isTestUser = false;
    this.state.isTestData = false;
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.removeItem('woobi_streak_user_mode');
      } catch (e) {}
    }
    this._emit(STREAK_EVENTS.UPDATED, this.getStatus());
    return this.getStatus();
  }

  _seedReferenceMemories() {
    this.seedTestUserStreak136();
  }

  seedStreakJun21ToToday() {
    return this.seedTestUserStreak136();
  }

  seedTestUserStreak136() {
    this.memories = [];
    const demoGarments = [
      { name: 'Navy Tailored Oxford & Sand Chinos', img: 'assets/navy_shirt.jpg' },
      { name: 'White Linen Classic Ensemble', img: 'assets/white_linen_shirt.jpg' },
      { name: 'Structured Autumn Blazer & Slacks', img: 'assets/smart_blazer.jpg' },
      { name: 'Casual Earth Tone Terracotta Look', img: 'assets/terracotta_tee.jpg' },
      { name: 'Minimalist Indigo Kurti & Trousers', img: 'assets/indigo_kurti.jpg' },
      { name: 'Festive Olive Ensemble', img: 'assets/olive_kurta.jpg' }
    ];

    const startDate = new Date(2026, 5, 21); // June 21, 2026 (0-indexed month: 5 = June)
    const endDate = new Date(2026, 10, 3);   // November 3, 2026 (10 = November)

    let streakCounter = 1;
    const cur = new Date(startDate.getTime());

    while (cur <= endDate) {
      const y = cur.getFullYear();
      const m = String(cur.getMonth() + 1).padStart(2, '0');
      const d = String(cur.getDate()).padStart(2, '0');
      const dateKey = `${y}-${m}-${d}`;
      const garment = demoGarments[(streakCounter - 1) % demoGarments.length];

      this.memories.push({
        id: `mem_test_streak_${dateKey.replace(/-/g, '')}`,
        date: dateKey,
        timestamp: new Date(`${dateKey}T10:30:00Z`).getTime(),
        photoUrl: garment.img,
        note: `[TEST DATA] Day ${streakCounter} • ${garment.name}`,
        streakDay: streakCounter,
        isTestData: true
      });

      streakCounter++;
      cur.setDate(cur.getDate() + 1);
    }

    const totalDays = streakCounter - 1; // 136 days
    this.state.currentStreak = totalDays;
    this.state.bestStreak = totalDays;
    this.state.savedPreviousStreak = 0;
    this.state.isStreakBroken = false;
    this.state.hasEarnedStreak = true;
    this.state.uploadedToday = true;
    this.state.lastUploadTimestamp = new Date('2026-11-03T10:30:00Z').getTime();
    this.state.lastUploadDateStr = '2026-11-03';
    this.state.deadline = Date.now() + this.options.deadlineDurationMs;
    this.state.isTestUser = true;
    this.state.isTestData = true;

    this.save();
    this._emit(STREAK_EVENTS.UPDATED, this.getStatus());
    return { success: true, streak: totalDays, totalMemories: this.memories.length };
  }

  getFirstMemoryDateStr() {
    if (!this.memories || this.memories.length === 0) return null;
    let earliest = this.memories[0].date;
    for (let i = 1; i < this.memories.length; i++) {
      if (this.memories[i].date && this.memories[i].date < earliest) {
        earliest = this.memories[i].date;
      }
    }
    return earliest;
  }

  save() {
    const serializedState = JSON.stringify(this.state);
    const serializedMemories = JSON.stringify(this.memories);

    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(this.options.storageKey, serializedState);
        localStorage.setItem(this.options.memoriesKey, serializedMemories);
      } catch (e) {
        console.warn('[StreakState] Could not save state to localStorage:', e);
      }
    } else if (this._memoryStore) {
      this._memoryStore.set(this.options.storageKey, serializedState);
      this._memoryStore.set(this.options.memoriesKey, serializedMemories);
    }
  }

  // ---------------------------------------------------------------------------
  // Status & Calculations
  // ---------------------------------------------------------------------------
  _checkDailyStatus() {
    const todayStr = this.formatDateKey();
    const hasTodayMemory = this.hasUploadedOnDate(todayStr);

    this.state.uploadedToday = hasTodayMemory || (this.state.lastUploadDateStr === todayStr);

    if (this.state.uploadedToday) {
      this.state.isStreakBroken = false;
      return;
    }

    // Check if deadline expired
    const now = Date.now();
    if (now > this.state.deadline) {
      // If user had never earned a streak (brand new user), do not show broken streak
      if (this.state.hasEarnedStreak && this.state.currentStreak > 0) {
        this.state.savedPreviousStreak = this.state.currentStreak;
        this.state.currentStreak = 0;
        this.state.isStreakBroken = true;
        this._emit(STREAK_EVENTS.BROKEN, { previousStreak: this.state.savedPreviousStreak });
      }
    }
  }

  hasUploadedToday() {
    const todayStr = this.formatDateKey();
    return this.hasUploadedOnDate(todayStr);
  }

  hasUploadedOnDate(dateStr) {
    return this.memories.some(m => m.date === dateStr);
  }

  getMemoryByDate(dateStr) {
    return this.memories.find(m => m.date === dateStr) || null;
  }

  getAllMemories() {
    return [...this.memories].sort((a, b) => b.date.localeCompare(a.date));
  }

  // ---------------------------------------------------------------------------
  // Streak Levels & Tier Calculation (5 Fire Levels: 1-9, 10-29, 30-49, 50-99, 100+)
  // ---------------------------------------------------------------------------
  getFireLevel(streakCount) {
    const s = typeof streakCount === 'number' ? streakCount : 0;
    if (s <= 0) return 0;
    if (s >= 100) return 5;
    if (s >= 50) return 4;
    if (s >= 30) return 3;
    if (s >= 10) return 2;
    return 1;
  }

  getFireLevelName(streakCount) {
    const level = this.getFireLevel(streakCount);
    switch (level) {
      case 5: return 'Final Fire';
      case 4: return 'Fourth Fire';
      case 3: return 'Third Fire';
      case 2: return 'Second Fire';
      case 1: return 'First Fire';
      default: return 'Spark Flame';
    }
  }

  getStreakStatus() {
    this._checkDailyStatus();
    const now = Date.now();
    const msRemaining = Math.max(0, this.state.deadline - now);
    const cur = this.state.currentStreak || 0;

    return {
      currentStreak: cur,
      fireLevel: this.getFireLevel(cur),
      fireLevelName: this.getFireLevelName(cur),
      bestStreak: this.state.bestStreak,
      savedPreviousStreak: this.state.savedPreviousStreak,
      isStreakBroken: this.state.isStreakBroken,
      hasEarnedStreak: this.state.hasEarnedStreak,
      uploadedToday: this.state.uploadedToday,
      deadline: this.state.deadline,
      msRemaining,
      isRestoreAvailable: this.isMonthlyRestoreAvailable(),
      nextRefreshDate: this.getNextRestoreRefreshDateStr(),
      isTestUser: this.isTestUser()
    };
  }

  getStatus() {
    return this.getStreakStatus();
  }

  // ---------------------------------------------------------------------------
  // Daily Outfit Upload & Streak Increment
  // ---------------------------------------------------------------------------
  recordDailyOutfitUpload({ photoUrl, note = '', customDate = null }) {
    const targetDate = customDate ? this.formatDateKey(new Date(customDate)) : this.formatDateKey();

    // Prevent duplicate streak entries for the same day:
    // If the user takes more than one photo today, save it to memories/gallery,
    // but keep streak count at 1 increment per calendar day!
    if (this.hasUploadedOnDate(targetDate)) {
      const memory = {
        id: `mem_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        date: targetDate,
        timestamp: Date.now(),
        photoUrl: photoUrl || 'assets/welcome_hero.jpg',
        note: note.trim() || `Day ${this.state.currentStreak} Outfit Look`,
        streakDay: this.state.currentStreak
      };
      this.memories.push(memory);
      this.save();
      this._emit(STREAK_EVENTS.UPDATED, {
        streak: this.state.currentStreak,
        memory
      });
      return {
        success: false,
        alreadyUploaded: true,
        streak: this.state.currentStreak,
        message: `Outfit photo saved to your gallery! Daily streak remains ${this.state.currentStreak} (1 streak per day).`,
        memory
      };
    }

    const yesterdayStr = this.getYesterdayDateKey(targetDate);
    const lastUpload = this.state.lastUploadDateStr;

    // Calculate streak advancement
    if (!lastUpload || !this.state.hasEarnedStreak || this.state.isStreakBroken) {
      // First upload or starting after break
      this.state.currentStreak = 1;
    } else if (lastUpload === yesterdayStr) {
      // Consecutive consecutive day!
      this.state.currentStreak += 1;
    } else {
      // Missed one or more days between
      this.state.currentStreak = 1;
    }

    this.state.hasEarnedStreak = true;
    this.state.isStreakBroken = false;
    this.state.bestStreak = Math.max(this.state.bestStreak, this.state.currentStreak);
    this.state.savedPreviousStreak = this.state.currentStreak;
    this.state.lastUploadTimestamp = Date.now();
    this.state.lastUploadDateStr = targetDate;
    this.state.deadline = Date.now() + this.options.deadlineDurationMs;
    this.state.uploadedToday = (targetDate === this.formatDateKey());
    this.state.morningReminderSent = false;
    this.state.urgentReminderSent = false;

    // Create and save memory
    const memory = {
      id: `mem_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      date: targetDate,
      timestamp: Date.now(),
      photoUrl: photoUrl || 'assets/welcome_hero.jpg',
      note: note.trim() || `Day ${this.state.currentStreak} Outfit Look`,
      streakDay: this.state.currentStreak
    };

    this.memories.push(memory);
    this.save();

    this._emit(STREAK_EVENTS.UPDATED, {
      streak: this.state.currentStreak,
      memory
    });
    this._emit(STREAK_EVENTS.MEMORY_ADDED, memory);

    return {
      success: true,
      streak: this.state.currentStreak,
      memory
    };
  }

  // ---------------------------------------------------------------------------
  // Monthly Restoration
  // ---------------------------------------------------------------------------
  isMonthlyRestoreAvailable(date = new Date()) {
    const currentCycle = this.getMonthlyRestoreCycleKey(date);
    return this.state.lastRestoredCycleKey !== currentCycle;
  }

  restoreMonthlyStreak() {
    if (!this.state.hasEarnedStreak && this.state.savedPreviousStreak <= 0) {
      return {
        success: false,
        error: 'No previous streak history found to restore.'
      };
    }

    const currentCycle = this.getMonthlyRestoreCycleKey();
    if (!this.isMonthlyRestoreAvailable()) {
      return {
        success: false,
        error: `Monthly restore already used for this calendar month. Refreshes on ${this.getNextRestoreRefreshDateStr()}.`
      };
    }

    const restoredStreak = this.state.savedPreviousStreak > 0 ? this.state.savedPreviousStreak : 1;
    this.state.currentStreak = restoredStreak;
    this.state.isStreakBroken = false;
    this.state.hasEarnedStreak = true;
    this.state.lastRestoredCycleKey = currentCycle;
    this.state.deadline = Date.now() + this.options.deadlineDurationMs;

    this.save();
    this._emit(STREAK_EVENTS.RESTORED, { streak: this.state.currentStreak });

    return {
      success: true,
      streak: this.state.currentStreak
    };
  }

  startFreshStreak() {
    this.state.currentStreak = 0;
    this.state.savedPreviousStreak = 0;
    this.state.isStreakBroken = false;
    this.state.uploadedToday = false;
    this.state.deadline = Date.now() + this.options.deadlineDurationMs;

    this.save();
    this._emit(STREAK_EVENTS.RESET, { streak: 0 });

    return { success: true, streak: 0 };
  }

  // ---------------------------------------------------------------------------
  // Monthly Calendar Generator
  // ---------------------------------------------------------------------------
  getMonthlyCalendarData(year, month) {
    const now = new Date();
    const y = typeof year === 'number' ? year : now.getFullYear();
    const m = typeof month === 'number' ? month : now.getMonth();

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const firstDate = new Date(y, m, 1);
    const firstDayOfWeek = firstDate.getDay(); // 0 (Sun) to 6 (Sat)
    const daysInMonth = new Date(y, m + 1, 0).getDate();

    const todayStr = this.formatDateKey(now);
    const firstMemoryDate = this.getFirstMemoryDateStr();
    const days = [];

    let activeDays = 0;
    let brokenDays = 0;
    let upcomingDays = 0;
    let runningStreak = 0;

    // If viewing reference month October 2026 without user memories, present target design reference
    const isReferenceOctober = (y === 2026 && m === 9 && !this.memories.some(mem => mem.date && mem.date.startsWith('2026-10-') && !mem.isTestData));

    for (let day = 1; day <= daysInMonth; day++) {
      const dayStr = String(day).padStart(2, '0');
      const monthStr = String(m + 1).padStart(2, '0');
      const dateKey = `${y}-${monthStr}-${dayStr}`;

      const memory = this.getMemoryByDate(dateKey);
      const isPast = dateKey < todayStr;
      const isToday = dateKey === todayStr;
      const isFuture = dateKey > todayStr;

      let status = 'upcoming';

      if (isReferenceOctober) {
        if ((day >= 1 && day <= 13) || (day >= 17 && day <= 27)) {
          status = 'completed';
          if (activeDays < 20) activeDays++;
        } else if ((day >= 14 && day <= 16) || day === 28 || day === 29) {
          status = 'missed';
          brokenDays++;
        } else {
          status = 'upcoming';
          upcomingDays++;
        }
      } else if (memory) {
        status = 'completed';
        activeDays++;
      } else if (isToday) {
        status = this.state.uploadedToday ? 'completed' : 'today';
        if (status === 'completed') activeDays++;
        else upcomingDays++;
      } else if (!this.state.hasEarnedStreak || !firstMemoryDate || dateKey < firstMemoryDate) {
        // Sunken crater socket before streak started or for new user
        status = 'upcoming';
        upcomingDays++;
      } else if (isPast) {
        status = 'missed';
        brokenDays++;
      } else {
        status = 'upcoming';
        upcomingDays++;
      }

      let fireLevel = 1;
      let streakOnDay = 0;
      if (status === 'completed') {
        runningStreak++;
        streakOnDay = (memory && typeof memory.streakDay === 'number' && memory.streakDay > 0) ? memory.streakDay : runningStreak;
        fireLevel = this.getFireLevel(streakOnDay);
      } else if (status === 'missed') {
        runningStreak = 0;
      }

      days.push({
        day,
        dateKey,
        dayOfWeek: new Date(y, m, day).getDay(),
        status, // 'completed' | 'missed' | 'today' | 'upcoming'
        fireLevel: status === 'completed' ? fireLevel : 0,
        fireLevelName: status === 'completed' ? this.getFireLevelName(streakOnDay) : '',
        streakOnDay,
        memory: memory || null,
        isTestData: Boolean(memory && memory.isTestData)
      });
    }

    return {
      year: y,
      month: m,
      monthName: monthNames[m],
      firstDayOfWeek,
      daysInMonth,
      days,
      stats: {
        activeDays,
        brokenDays,
        upcomingDays
      }
    };
  }

  // ---------------------------------------------------------------------------
  // Event Emitter
  // ---------------------------------------------------------------------------
  on(event, callback) {
    if (typeof callback !== 'function') return () => {};
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
    return () => this.listeners.get(event)?.delete(callback);
  }

  _emit(event, payload) {
    if (!this.listeners.has(event)) return;
    this.listeners.get(event).forEach(cb => {
      try { cb(payload); } catch (e) { console.error(`[StreakState] Listener error on [${event}]:`, e); }
    });
  }
}

// Singleton factory
let defaultInstance = null;
export function createStreakState(options = {}) {
  return new StreakState(options);
}

export function getStreakState() {
  if (!defaultInstance) {
    defaultInstance = new StreakState();
  }
  return defaultInstance;
}

export const streakState = getStreakState();
export default streakState;
