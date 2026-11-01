import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { DatabaseService, createDatabaseService, DB_ENTITIES, DB_EVENTS } from './index.js';

describe('Database Submodule - DatabaseService', () => {
  let db;

  beforeEach(() => {
    // Run in in-memory mode for isolated test execution
    db = createDatabaseService({ inMemoryOnly: true });
  });

  // 1. Initialization
  it('1. initializes all standard entity repositories', () => {
    assert.ok(db.users);
    assert.ok(db.wardrobe);
    assert.ok(db.looks);
    assert.ok(db.avatar);
    assert.ok(db.settings);
    assert.ok(db.streak);
    assert.ok(db.subscriptions);
  });

  // 2. Initial Migration Event
  it('2. emits db:migration_applied on initial startup', () => {
    let migrationData = null;
    const testDb = createDatabaseService({ inMemoryOnly: true });
    testDb.on(DB_EVENTS.MIGRATION_APPLIED, (d) => { migrationData = d; });
    testDb.runInitialMigrations();

    assert.ok(migrationData);
    assert.strictEqual(migrationData.version, '1.0.0');
  });

  // 3. User Repository - Create and Read
  it('3. creates and retrieves user records by ID', async () => {
    const user = await db.users.create({
      id: 'usr_test_1',
      email: 'alex@example.com',
      displayName: 'Alex'
    });

    assert.strictEqual(user.id, 'usr_test_1');
    const fetched = await db.users.findById('usr_test_1');
    assert.strictEqual(fetched.email, 'alex@example.com');
  });

  // 4. User Repository - Find By Email
  it('4. retrieves users by case-insensitive email address', async () => {
    await db.users.create({ id: 'usr_test_2', email: 'sam@woobi.com' });
    const found = await db.users.findByEmail('SAM@WOOBI.COM');
    assert.ok(found);
    assert.strictEqual(found.id, 'usr_test_2');
  });

  // 5. Wardrobe Repository - Scoped Creation
  it('5. creates wardrobe items bound to specific user ID', async () => {
    const item = await db.wardrobe.create({
      userId: 'usr_userA',
      name: 'Navy Blazer',
      category: 'top'
    });

    assert.ok(item.id.startsWith('item_'));
    assert.strictEqual(item.userId, 'usr_userA');
  });

  // 6. Wardrobe Repository - Cross-User Isolation (User A cannot see User B)
  it('6. strictly isolates wardrobe items so User A cannot access User B items', async () => {
    await db.wardrobe.create({ userId: 'usr_userA', name: 'Item A1' });
    await db.wardrobe.create({ userId: 'usr_userA', name: 'Item A2' });
    await db.wardrobe.create({ userId: 'usr_userB', name: 'Item B1' });

    const userAItems = await db.wardrobe.findByUser('usr_userA');
    const userBItems = await db.wardrobe.findByUser('usr_userB');

    assert.strictEqual(userAItems.length, 2);
    assert.strictEqual(userBItems.length, 1);
    assert.strictEqual(userAItems.some(i => i.name === 'Item B1'), false);
  });

  // 7. Wardrobe Repository - Cross-User Item Retrieval Block
  it('7. returns null when attempting to findByIdAndUser with wrong owner', async () => {
    const item = await db.wardrobe.create({ userId: 'usr_userA', name: 'Silk Shirt' });
    const itemForA = await db.wardrobe.findByIdAndUser(item.id, 'usr_userA');
    const itemForB = await db.wardrobe.findByIdAndUser(item.id, 'usr_userB');

    assert.ok(itemForA);
    assert.strictEqual(itemForB, null);
  });

  // 8. Wardrobe Repository - Scoped Update
  it('8. updates wardrobe item only if user is the verified owner', async () => {
    const item = await db.wardrobe.create({ userId: 'usr_userA', name: 'Old Boots', condition: 'good' });

    // Unauthorized attempt by User B
    const failedUpdate = await db.wardrobe.updateForUser(item.id, 'usr_userB', { condition: 'worn' });
    assert.strictEqual(failedUpdate, null);

    // Authorized attempt by User A
    const successfulUpdate = await db.wardrobe.updateForUser(item.id, 'usr_userA', { condition: 'excellent' });
    assert.ok(successfulUpdate);
    assert.strictEqual(successfulUpdate.condition, 'excellent');
  });

  // 9. Wardrobe Repository - Scoped Deletion
  it('9. prevents unauthorized deletion of items owned by another user', async () => {
    const item = await db.wardrobe.create({ userId: 'usr_userA', name: 'Cardigan' });

    const deletedByB = await db.wardrobe.deleteForUser(item.id, 'usr_userB');
    assert.strictEqual(deletedByB, false);

    const deletedByA = await db.wardrobe.deleteForUser(item.id, 'usr_userA');
    assert.strictEqual(deletedByA, true);

    const check = await db.wardrobe.findById(item.id);
    assert.strictEqual(check, null);
  });

  // 10. Saved Looks Repository - Scoped Operations
  it('10. creates and queries saved outfits scoped by user', async () => {
    await db.looks.create({ userId: 'usr_1', name: 'Autumn Office', occasion: 'work' });
    await db.looks.create({ userId: 'usr_1', name: 'Evening Gala', occasion: 'formal' });

    const looks = await db.looks.findByUser('usr_1');
    assert.strictEqual(looks.length, 2);
    assert.strictEqual(looks[0].name, 'Autumn Office');
  });

  // 11. Saved Looks Repository - Delete Outfit
  it('11. deletes saved looks when requested by authorized owner', async () => {
    const look = await db.looks.create({ userId: 'usr_1', name: 'Casual Friday' });
    const deleted = await db.looks.deleteForUser(look.id, 'usr_1');
    assert.strictEqual(deleted, true);

    const looks = await db.looks.findByUser('usr_1');
    assert.strictEqual(looks.length, 0);
  });

  // 12. Avatar Repository - Save and Get Preferences
  it('12. saves and retrieves avatar 3D customizations per user', async () => {
    const initial = await db.avatar.saveForUser('usr_1', {
      skinTone: '#E0AC69',
      hairStyle: 'undercut',
      hairColor: '#2B1B17'
    });
    assert.strictEqual(initial.skinTone, '#E0AC69');

    // Update existing avatar
    const updated = await db.avatar.saveForUser('usr_1', {
      hairColor: '#DDAA55'
    });
    assert.strictEqual(updated.hairColor, '#DDAA55');
    assert.strictEqual(updated.skinTone, '#E0AC69'); // Retains prior fields
  });

  // 13. Settings Repository - User Preferences Persistence
  it('13. saves and updates user application settings', async () => {
    await db.settings.saveForUser('usr_2', {
      appTheme: 'dark',
      studioLighting: 'golden_hour'
    });

    const settings = await db.settings.getForUser('usr_2');
    assert.strictEqual(settings.appTheme, 'dark');
    assert.strictEqual(settings.studioLighting, 'golden_hour');
  });

  // 14. Streak Repository - Daily Outfit Logging
  it('14. records streak increments and updates best streak', async () => {
    const day1 = await db.streak.recordStreak('usr_3', '2026-11-01');
    assert.strictEqual(day1.currentStreak, 1);
    assert.strictEqual(day1.bestStreak, 1);

    const day2 = await db.streak.recordStreak('usr_3', '2026-11-02');
    assert.strictEqual(day2.currentStreak, 2);
    assert.strictEqual(day2.bestStreak, 2);
  });

  // 15. Streak Repository - Query Existing Streak
  it('15. returns null when querying streak for non-existent user', async () => {
    const streak = await db.streak.getForUser('usr_unknown');
    assert.strictEqual(streak, null);
  });

  // 16. Subscription Repository - Server-Authoritative Entitlements
  it('16. stores and retrieves authoritative server subscription records', async () => {
    const entitlement = await db.subscriptions.setEntitlement('usr_4', {
      plan: 'monthly',
      isPremium: true,
      status: 'active'
    });

    assert.strictEqual(entitlement.plan, 'monthly');
    assert.strictEqual(entitlement.isPremium, true);

    const check = await db.subscriptions.getForUser('usr_4');
    assert.strictEqual(check.isPremium, true);
  });

  // 17. Subscription Repository - Entitlement Downgrade
  it('17. accurately updates entitlement on cancellation or downgrade', async () => {
    await db.subscriptions.setEntitlement('usr_5', { plan: 'annual', isPremium: true });
    await db.subscriptions.setEntitlement('usr_5', { plan: 'free', isPremium: false, status: 'canceled' });

    const sub = await db.subscriptions.getForUser('usr_5');
    assert.strictEqual(sub.plan, 'free');
    assert.strictEqual(sub.isPremium, false);
    assert.strictEqual(sub.status, 'canceled');
  });

  // 18. Base Repository - Update Non-existent ID
  it('18. returns null when updating an entity that does not exist', async () => {
    const res = await db.users.update('usr_nonexistent', { displayName: 'Ghost' });
    assert.strictEqual(res, null);
  });

  // 19. Base Repository - Delete Non-existent ID
  it('19. returns false when deleting an entity that does not exist', async () => {
    const res = await db.users.delete('usr_nonexistent');
    assert.strictEqual(res, false);
  });

  // 20. Event Emission - Entity Creation
  it('20. emits db:entity_created event with collection and entity payload', async () => {
    let eventReceived = null;
    db.on(DB_EVENTS.ENTITY_CREATED, (d) => { eventReceived = d; });

    await db.users.create({ id: 'usr_ev_1', email: 'event@test.com' });
    assert.ok(eventReceived);
    assert.strictEqual(eventReceived.collection, DB_ENTITIES.USERS);
    assert.strictEqual(eventReceived.entity.id, 'usr_ev_1');
  });

  // 21. Event Emission - Entity Update
  it('21. emits db:entity_updated event on record modification', async () => {
    let eventReceived = null;
    db.on(DB_EVENTS.ENTITY_UPDATED, (d) => { eventReceived = d; });

    const user = await db.users.create({ id: 'usr_ev_2', displayName: 'Initial' });
    await db.users.update(user.id, { displayName: 'Modified' });

    assert.ok(eventReceived);
    assert.strictEqual(eventReceived.collection, DB_ENTITIES.USERS);
    assert.strictEqual(eventReceived.entity.displayName, 'Modified');
  });

  // 22. Event Emission - Entity Deletion
  it('22. emits db:entity_deleted event on record removal', async () => {
    let eventReceived = null;
    db.on(DB_EVENTS.ENTITY_DELETED, (d) => { eventReceived = d; });

    const user = await db.users.create({ id: 'usr_ev_3', displayName: 'ToDelete' });
    await db.users.delete(user.id);

    assert.ok(eventReceived);
    assert.strictEqual(eventReceived.collection, DB_ENTITIES.USERS);
    assert.strictEqual(eventReceived.id, user.id);
  });

  // 23. Immutability of Record ID on Update
  it('23. preserves original ID even if update payload attempts to alter it', async () => {
    const item = await db.wardrobe.create({ userId: 'usr_1', name: 'Original Item' });
    const updated = await db.wardrobe.update(item.id, { id: 'hacked_id', name: 'New Name' });

    assert.strictEqual(updated.id, item.id);
  });

  // 24. Reset All Cache and Collections
  it('24. cleans up cached collections via resetAll()', async () => {
    await db.users.create({ id: 'usr_purge', email: 'purge@test.com' });
    assert.strictEqual((await db.users.getAll()).length, 1);

    db.resetAll();
    assert.strictEqual((await db.users.getAll()).length, 0);
  });

  // 25. Safe Handling of Empty userId in UserScopedRepository
  it('25. returns empty list or null when userId is missing or undefined', async () => {
    const items = await db.wardrobe.findByUser(null);
    assert.deepStrictEqual(items, []);

    const single = await db.wardrobe.findByIdAndUser('item_1', null);
    assert.strictEqual(single, null);
  });
});
