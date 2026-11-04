import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { StreakState, STREAK_EVENTS } from './StreakState.js';

describe('Core Module - Daily Outfit Streak & Memories State Engine', () => {
  let streakState;

  beforeEach(() => {
    // Isolated instance with no storage key interference
    streakState = new StreakState({
      storageKey: null,
      memoriesKey: null
    });
    streakState.memories = [];
  });

  it('1. initializes with zero streak and no broken streak state for a new user', () => {
    const status = streakState.getStreakStatus();
    assert.strictEqual(status.currentStreak, 0);
    assert.strictEqual(status.bestStreak, 0);
    assert.strictEqual(status.isStreakBroken, false);
    assert.strictEqual(status.hasEarnedStreak, false);
    assert.strictEqual(status.uploadedToday, false);
  });

  it('2. does not show a lost streak to a new user who has never earned one', () => {
    // Simulate expired deadline on brand new user
    streakState.state.deadline = Date.now() - 10000;
    const status = streakState.getStreakStatus();
    assert.strictEqual(status.isStreakBroken, false, 'New user should never have isStreakBroken true');
    assert.strictEqual(status.savedPreviousStreak, 0);
  });

  it('3. records outfit upload and starts streak at 1 on first upload', () => {
    const res = streakState.recordDailyOutfitUpload({
      photoUrl: 'assets/navy_shirt.jpg',
      note: 'Day 1 Navy Look'
    });

    assert.strictEqual(res.success, true);
    assert.strictEqual(res.streak, 1);
    assert.strictEqual(res.memory.photoUrl, 'assets/navy_shirt.jpg');
    assert.strictEqual(res.memory.note, 'Day 1 Navy Look');
    assert.strictEqual(streakState.state.currentStreak, 1);
    assert.strictEqual(streakState.state.hasEarnedStreak, true);
    assert.strictEqual(streakState.hasUploadedToday(), true);
  });

  it('4. strictly prevents duplicate streak entries for the same calendar date', () => {
    const todayStr = streakState.formatDateKey();

    const first = streakState.recordDailyOutfitUpload({
      photoUrl: 'assets/navy_shirt.jpg',
      note: 'First look'
    });
    assert.strictEqual(first.success, true);
    assert.strictEqual(first.streak, 1);

    // Attempt second upload on same day
    const second = streakState.recordDailyOutfitUpload({
      photoUrl: 'assets/white_linen_shirt.jpg',
      note: 'Second look attempt'
    });

    assert.strictEqual(second.success, false);
    assert.strictEqual(second.alreadyUploaded, true);
    assert.strictEqual(streakState.state.currentStreak, 1, 'Streak should not increment on duplicate');
  });

  it('5. increments consecutive streak (+1) when uploaded on consecutive days', () => {
    // Day 1: yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = streakState.formatDateKey(yesterday);

    streakState.recordDailyOutfitUpload({
      photoUrl: 'assets/navy_shirt.jpg',
      note: 'Yesterday look',
      customDate: yesterdayStr
    });
    assert.strictEqual(streakState.state.currentStreak, 1);

    // Day 2: today
    const todayStr = streakState.formatDateKey();
    const todayRes = streakState.recordDailyOutfitUpload({
      photoUrl: 'assets/white_linen_shirt.jpg',
      note: 'Today look',
      customDate: todayStr
    });

    assert.strictEqual(todayRes.success, true);
    assert.strictEqual(todayRes.streak, 2);
    assert.strictEqual(streakState.state.currentStreak, 2);
    assert.strictEqual(streakState.state.bestStreak, 2);
  });

  it('6. handles missed days correctly by resetting streak to 1 after an interruption', () => {
    // Day 1: 3 days ago
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    streakState.recordDailyOutfitUpload({
      photoUrl: 'assets/navy_shirt.jpg',
      customDate: streakState.formatDateKey(threeDaysAgo)
    });
    assert.strictEqual(streakState.state.currentStreak, 1);

    // Upload today (missed 2 days in between)
    const todayRes = streakState.recordDailyOutfitUpload({
      photoUrl: 'assets/smart_blazer.jpg'
    });

    assert.strictEqual(todayRes.success, true);
    assert.strictEqual(todayRes.streak, 1, 'Streak resets to 1 after missing days');
  });

  it('7. keeps every photo connected to its corresponding calendar date', () => {
    streakState.recordDailyOutfitUpload({
      photoUrl: 'assets/smart_blazer.jpg',
      note: 'Executive meeting blazer',
      customDate: '2026-11-01'
    });

    const memory = streakState.getMemoryByDate('2026-11-01');
    assert.ok(memory, 'Memory must exist for 2026-11-01');
    assert.strictEqual(memory.date, '2026-11-01');
    assert.strictEqual(memory.photoUrl, 'assets/smart_blazer.jpg');
    assert.strictEqual(memory.note, 'Executive meeting blazer');
  });

  it('8. allows retrieving and sorting all previous outfit memories by date', () => {
    streakState.recordDailyOutfitUpload({ photoUrl: 'img1.jpg', customDate: '2026-11-01' });
    streakState.recordDailyOutfitUpload({ photoUrl: 'img2.jpg', customDate: '2026-11-02' });

    const all = streakState.getAllMemories();
    assert.ok(all.length >= 2);
    assert.strictEqual(all[0].date, '2026-11-02', 'Most recent memory should be first');
    assert.strictEqual(all[1].date, '2026-11-01');
  });

  it('9. generates monthly circular calendar data with correct day properties and stats', () => {
    streakState.recordDailyOutfitUpload({ photoUrl: 'img.jpg', customDate: '2026-10-15' });

    const calData = streakState.getMonthlyCalendarData(2026, 9); // October (0-indexed: 9)
    assert.strictEqual(calData.monthName, 'October');
    assert.strictEqual(calData.daysInMonth, 31);
    assert.strictEqual(calData.days.length, 31);

    const day15 = calData.days.find(d => d.day === 15);
    assert.strictEqual(day15.status, 'completed');
    assert.ok(day15.memory !== null);
  });

  it('10. classifies completed days, missed days and upcoming days properly', () => {
    streakState.recordDailyOutfitUpload({ photoUrl: 'img.jpg', customDate: '2026-11-01' });

    const now = new Date();
    const calData = streakState.getMonthlyCalendarData(now.getFullYear(), now.getMonth());
    const day1 = calData.days.find(d => d.day === 1);
    assert.strictEqual(day1.status, 'completed');

    const todayDay = calData.days.find(d => d.day === now.getDate());
    assert.ok(['today', 'completed'].includes(todayDay.status));

    const futureDay = calData.days.find(d => d.day > now.getDate());
    if (futureDay) {
      assert.strictEqual(futureDay.status, 'upcoming');
    }
  });

  it('11. verifies monthly restore eligibility (1 free per calendar month cycle)', () => {
    const isAvail = streakState.isMonthlyRestoreAvailable();
    assert.strictEqual(isAvail, true, 'Brand new or fresh cycle should have restore available');

    // Simulate broken streak
    streakState.state.hasEarnedStreak = true;
    streakState.state.currentStreak = 0;
    streakState.state.savedPreviousStreak = 5;
    streakState.state.isStreakBroken = true;

    const restoreRes = streakState.restoreMonthlyStreak();
    assert.strictEqual(restoreRes.success, true);
    assert.strictEqual(restoreRes.streak, 5);
    assert.strictEqual(streakState.state.isStreakBroken, false);

    // Second restore in same cycle should be rejected
    const secondRestore = streakState.restoreMonthlyStreak();
    assert.strictEqual(secondRestore.success, false);
    assert.ok(secondRestore.error.includes('already used'));
  });

  it('12. allows starting a fresh streak when desired', () => {
    streakState.state.currentStreak = 4;
    streakState.state.isStreakBroken = true;

    const res = streakState.startFreshStreak();
    assert.strictEqual(res.success, true);
    assert.strictEqual(streakState.state.currentStreak, 0);
    assert.strictEqual(streakState.state.isStreakBroken, false);
  });

  it('13. emits events on streak updates, breaks, restores, and memories', () => {
    let updatedFired = false;
    let memoryFired = false;

    streakState.on(STREAK_EVENTS.UPDATED, () => { updatedFired = true; });
    streakState.on(STREAK_EVENTS.MEMORY_ADDED, () => { memoryFired = true; });

    streakState.recordDailyOutfitUpload({ photoUrl: 'test.jpg' });

    assert.strictEqual(updatedFired, true);
    assert.strictEqual(memoryFired, true);
  });

  it('14. calculates next restore refresh date string accurately for UI display', () => {
    const refreshDateStr = streakState.getNextRestoreRefreshDateStr(new Date('2026-11-05'));
    assert.strictEqual(refreshDateStr, 'Dec 3, 2026');

    const refreshBefore3rd = streakState.getNextRestoreRefreshDateStr(new Date('2026-11-01'));
    assert.strictEqual(refreshBefore3rd, 'Nov 3, 2026');
  });

  it('15. detects broken streak when deadline passes on an active streak', () => {
    streakState.state.hasEarnedStreak = true;
    streakState.state.currentStreak = 4;
    streakState.state.deadline = Date.now() - 5000; // Past deadline
    streakState.state.uploadedToday = false;

    const status = streakState.getStreakStatus();
    assert.strictEqual(status.isStreakBroken, true);
    assert.strictEqual(status.currentStreak, 0);
    assert.strictEqual(status.savedPreviousStreak, 4);
  });

  it('16. prevents restoration if user never earned a streak', () => {
    streakState.state.hasEarnedStreak = false;
    streakState.state.currentStreak = 0;
    streakState.state.savedPreviousStreak = 0;
    streakState.state.lastRestoredCycleKey = null;

    const res = streakState.restoreMonthlyStreak();
    assert.strictEqual(res.success, false);
    assert.ok(res.error.includes('No previous streak'));
  });

  it('17. isolates state and memories between different users via setUserId', () => {
    streakState.setUserId('user_alice');
    streakState.state.currentStreak = 10;
    streakState.save();

    streakState.setUserId('user_bob');
    assert.strictEqual(streakState.state.currentStreak, 0, 'User Bob starts with clean state');
  });

  it('18. rolls over monthly restore eligibility across calendar month boundaries', () => {
    // Used in November 2026
    const novDate = new Date('2026-11-10');
    streakState.state.lastRestoredCycleKey = streakState.getMonthlyRestoreCycleKey(novDate);
    assert.strictEqual(streakState.isMonthlyRestoreAvailable(novDate), false, 'Not available in same cycle');

    // Available in December 2026
    const decDate = new Date('2026-12-10');
    assert.strictEqual(streakState.isMonthlyRestoreAvailable(decDate), true, 'Available in next month cycle');
  });
});

