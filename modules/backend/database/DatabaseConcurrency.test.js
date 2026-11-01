import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { createDatabaseService, DB_EVENTS } from './index.js';

describe('Backend Hardening - Database Durability, Concurrency & Recovery', () => {
  const testDir = path.resolve('data_concurrency_test');

  beforeEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  // 1. Concurrent writes serialized without record loss
  it('1. serializes concurrent writes to the same collection without data loss', async () => {
    const db = createDatabaseService({ dataDir: testDir, inMemoryOnly: false });

    // Launch 20 concurrent creation operations
    const promises = [];
    for (let i = 0; i < 20; i++) {
      promises.push(db.wardrobe.create({
        userId: 'usr_concurrent',
        name: `Garment ${i}`,
        category: 'top'
      }));
    }

    const createdItems = await Promise.all(promises);
    assert.strictEqual(createdItems.length, 20);

    // Verify disk state
    const fetchedItems = await db.wardrobe.findByUser('usr_concurrent');
    assert.strictEqual(fetchedItems.length, 20);

    db.resetAll();
  });

  // 2. Automatic Recovery from .bak Backup File
  it('2. automatically recovers collection from .bak backup file when primary JSON is corrupted', async () => {
    const db = createDatabaseService({ dataDir: testDir, inMemoryOnly: false });

    // 1. Populate valid data (generates .bak on second write)
    await db.users.create({ id: 'usr_valid_1', email: 'user1@woobi.com' });
    await db.users.create({ id: 'usr_valid_2', email: 'user2@woobi.com' });

    const primaryFile = db.getFilePath('users');
    const backupFile = db.getBackupFilePath('users');

    assert.ok(fs.existsSync(primaryFile));
    assert.ok(fs.existsSync(backupFile));

    // 2. Simulate catastrophic process crash / file truncation corrupting primary file
    fs.writeFileSync(primaryFile, '{"corrupted_incomplete_json: [', 'utf8');

    let corruptionEvent = null;
    let recoveryEvent = null;
    db.on(DB_EVENTS.CORRUPTION_DETECTED, (d) => { corruptionEvent = d; });
    db.on(DB_EVENTS.RECOVERED_FROM_BACKUP, (d) => { recoveryEvent = d; });

    // Invalidate cache to force disk read
    db.cache.delete('users');

    // 3. Read should detect corruption and restore from .bak
    const recovered = db.users.getAll();
    assert.ok(recovered.length >= 1);
    assert.ok(corruptionEvent);
    assert.ok(recoveryEvent);
    assert.strictEqual(recoveryEvent.collection, 'users');

    db.resetAll();
  });

  // 3. Multi-Record Atomic Transaction & Rollback
  it('3. rolls back staged changes if transaction throws an error', async () => {
    const db = createDatabaseService({ dataDir: testDir, inMemoryOnly: false });

    await db.users.create({ id: 'usr_tx_1', email: 'tx1@woobi.com', displayName: 'Initial Name' });

    let rollbackEmitted = false;
    db.on(DB_EVENTS.TRANSACTION_ROLLED_BACK, () => { rollbackEmitted = true; });

    // Execute failing transaction
    await assert.rejects(async () => {
      await db.transaction(async (txDb) => {
        await txDb.users.update('usr_tx_1', { displayName: 'Should Not Persist' });
        throw new Error('Simulated database write error midway through transaction');
      });
    }, /Simulated database write error/);

    assert.strictEqual(rollbackEmitted, true);
    const user = await db.users.findById('usr_tx_1');
    assert.strictEqual(user.displayName, 'Initial Name');

    db.resetAll();
  });

  // 4. Multi-Record Transaction Commit
  it('4. commits all modifications atomically when transaction succeeds', async () => {
    const db = createDatabaseService({ dataDir: testDir, inMemoryOnly: false });

    let commitEmitted = false;
    db.on(DB_EVENTS.TRANSACTION_COMMITTED, () => { commitEmitted = true; });

    await db.transaction(async (txDb) => {
      await txDb.users.create({ id: 'usr_tx_2', email: 'tx2@woobi.com' });
      await txDb.wardrobe.create({ userId: 'usr_tx_2', name: 'Transaction Suit' });
    });

    assert.strictEqual(commitEmitted, true);
    const user = await db.users.findById('usr_tx_2');
    const items = await db.wardrobe.findByUser('usr_tx_2');
    assert.ok(user);
    assert.strictEqual(items.length, 1);

    db.resetAll();
  });

  // 5. Persistent Session Revocation across Server Restarts
  it('5. preserves revoked token blacklist across simulated server restart', async () => {
    // Phase 1: Server Instance 1 generates and revokes token
    const db1 = createDatabaseService({ dataDir: testDir, inMemoryOnly: false });
    const token = 'session_token_to_revoke_12345';

    await db1.revokedTokens.revoke(token);
    assert.strictEqual(await db1.revokedTokens.isRevoked(token), true);

    // Phase 2: Simulate complete server reboot (fresh DatabaseService pointing to same disk data)
    const db2 = createDatabaseService({ dataDir: testDir, inMemoryOnly: false });
    const isRevokedOnReboot = await db2.revokedTokens.isRevoked(token);

    assert.strictEqual(isRevokedOnReboot, true);

    db2.resetAll();
  });
});

