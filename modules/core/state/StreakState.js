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
  // Persistence
  // ---------------------------------------------------------------------------
  _loadFromStorage() {
    if (typeof localStorage === 'undefined') return;

    try {
      const rawState = localStorage.getItem(this.options.storageKey) ||
                       localStorage.getItem(STREAK_STORAGE_KEYS.LEGACY);
      if (rawState) {
        const parsed = JSON.parse(rawState);
        if (parsed && typeof parsed === 'object') {
          // If stored state had old dummy starter streak, clean it up
          this.state = Object.assign(this.state, parsed);
        }
      }

      const rawMemories = localStorage.getItem(this.options.memoriesKey);
      if (rawMemories) {
        const parsed = JSON.parse(rawMemories);
        if (Array.isArray(parsed)) {
          this.memories = parsed;
        }
      } else {
        // Seed initial October reference memories matching Ember and Smoke Calendar
        this._seedReferenceMemories();
      }
    } catch (e) {
      console.warn('[StreakState] Could not load state from localStorage:', e);
    }
  }

  _seedReferenceMemories() {
    const demoOctDays = [1, 3, 6, 7, 9, 11, 12, 14, 15, 17, 18, 20, 21, 23, 25, 26, 28, 29, 31];
    const demoGarments = [
      { name: 'Navy Tailored Shirt', img: 'assets/navy_shirt.jpg' },
      { name: 'White Linen Classic', img: 'assets/white_linen_shirt.jpg' },
      { name: 'Smart Autumn Blazer', img: 'assets/smart_blazer.jpg' },
      { name: 'Casual Terracotta Tee', img: 'assets/terracotta_tee.jpg' },
      { name: 'Minimalist Indigo Kurti', img: 'assets/indigo_kurti.jpg' },
      { name: 'Festive Olive Ensemble', img: 'assets/olive_kurta.jpg' }
    ];

    let streakCounter = 1;
    demoOctDays.forEach((d, idx) => {
      const garment = demoGarments[idx % demoGarments.length];
      const dayStr = String(d).padStart(2, '0');
      this.memories.push({
        id: `mem_seed_202610${dayStr}`,
        date: `2026-10-${dayStr}`,
        timestamp: new Date(`2026-10-${dayStr}T10:30:00Z`).getTime(),
        photoUrl: garment.img,
        note: garment.name,
        streakDay: streakCounter++
      });
    });

    this.save();
  }

  save() {
    if (typeof localStorage === 'undefined') return;

    try {
      localStorage.setItem(this.options.storageKey, JSON.stringify(this.state));
      localStorage.setItem(this.options.memoriesKey, JSON.stringify(this.memories));
    } catch (e) {
      console.warn('[StreakState] Could not save state to localStorage:', e);
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

  getStreakStatus() {
    this._checkDailyStatus();
    const now = Date.now();
    const msRemaining = Math.max(0, this.state.deadline - now);

    return {
      currentStreak: this.state.currentStreak,
      bestStreak: this.state.bestStreak,
      savedPreviousStreak: this.state.savedPreviousStreak,
      isStreakBroken: this.state.isStreakBroken,
      hasEarnedStreak: this.state.hasEarnedStreak,
      uploadedToday: this.state.uploadedToday,
      deadline: this.state.deadline,
      msRemaining,
      isRestoreAvailable: this.isMonthlyRestoreAvailable(),
      nextRefreshDate: this.getNextRestoreRefreshDateStr()
    };
  }

  // ---------------------------------------------------------------------------
  // Daily Outfit Upload & Streak Increment
  // ---------------------------------------------------------------------------
  recordDailyOutfitUpload({ photoUrl, note = '', customDate = null }) {
    const targetDate = customDate ? this.formatDateKey(new Date(customDate)) : this.formatDateKey();

    // Prevent duplicate streak entries for the same day
    if (this.hasUploadedOnDate(targetDate)) {
      return {
        success: false,
        alreadyUploaded: true,
        message: `An outfit photo has already been logged for ${targetDate}. Each day allows one streak memory.`,
        memory: this.getMemoryByDate(targetDate)
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
    const currentCycle = this.getMonthlyRestoreCycleKey();
    if (!this.isMonthlyRestoreAvailable()) {
      return {
        success: false,
        error: `Monthly restore already used for this cycle. Refreshes on ${this.getNextRestoreRefreshDateStr()}.`
      };
    }

    const restoredStreak = this.state.savedPreviousStreak > 0 ? this.state.savedPreviousStreak : 1;
    this.state.currentStreak = restoredStreak;
    this.state.isStreakBroken = false;
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
    const days = [];

    let activeDays = 0;
    let brokenDays = 0;
    let upcomingDays = 0;

    for (let day = 1; day <= daysInMonth; day++) {
      const dayStr = String(day).padStart(2, '0');
      const monthStr = String(m + 1).padStart(2, '0');
      const dateKey = `${y}-${monthStr}-${dayStr}`;

      const memory = this.getMemoryByDate(dateKey);
      const isPast = dateKey < todayStr;
      const isToday = dateKey === todayStr;
      const isFuture = dateKey > todayStr;

      let status = 'upcoming';

      if (memory) {
        status = 'completed';
        activeDays++;
      } else if (isToday) {
        status = this.state.uploadedToday ? 'completed' : 'today';
        if (status === 'completed') activeDays++;
        else upcomingDays++;
      } else if (isPast) {
        status = 'missed';
        brokenDays++;
      } else {
        status = 'upcoming';
        upcomingDays++;
      }

      days.push({
        day,
        dateKey,
        dayOfWeek: new Date(y, m, day).getDay(),
        status, // 'completed' | 'missed' | 'today' | 'upcoming'
        memory: memory || null
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
