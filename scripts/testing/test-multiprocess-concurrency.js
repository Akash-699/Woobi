/**
 * Woobi - Multi-Process Concurrency, Durability & Crash Recovery Test Suite
 * Tests multi-process concurrent updates, inter-process OS locks, persistent revocation & disaster recovery
 */

import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fork } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createDatabaseService, DB_EVENTS } from '../../modules/backend/database/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const testDataDir = path.resolve('data_multiprocess_test');

// Child worker entry point when run with WORKER flag
if (process.env.WOOBI_WORKER_MODE === '1') {
  const workerId = process.env.WORKER_ID;
  const targetCollection = process.env.TARGET_COLLECTION || 'wardrobe';
  const itemCount = parseInt(process.env.ITEM_COUNT || '10', 10);

  const db = createDatabaseService({ dataDir: testDataDir });

  (async () => {
    try {
      for (let i = 0; i < itemCount; i++) {
        await db[targetCollection].create({
          userId: `usr_worker_${workerId}`,
          name: `Item_${workerId}_${i}`,
          category: 'top',
          workerId,
          itemIndex: i
        });
      }
      process.send({ success: true, workerId, itemsWritten: itemCount });
    } catch (err) {
      process.send({ success: false, workerId, error: err.message });
      process.exit(1);
    }
  })();
} else {
  // Test Suite Runner
  describe('Database Concurrency & Multi-Process Durability Suite', () => {
    beforeEach(() => {
      if (fs.existsSync(testDataDir)) {
        fs.rmSync(testDataDir, { recursive: true, force: true });
      }
      fs.mkdirSync(testDataDir, { recursive: true });
    });

    afterEach(() => {
      if (fs.existsSync(testDataDir)) {
        fs.rmSync(testDataDir, { recursive: true, force: true });
      }
    });

    // 1. Multi-Process Concurrent Writes
    it('1. coordinates concurrent writes from multiple independent Node OS processes without data loss', async () => {
      const numWorkers = 4;
      const itemsPerWorker = 10;
      const totalExpected = numWorkers * itemsPerWorker;

      // Seed collection with 1 initial record to establish backup baseline
      const masterDb = createDatabaseService({ dataDir: testDataDir });
      await masterDb.wardrobe.create({
        id: 'item_initial_seed',
        userId: 'usr_seed',
        name: 'Seed Garment',
        category: 'outerwear'
      });

      // Spawn independent Node worker processes
      const workers = [];
      const workerPromises = [];

      for (let w = 0; w < numWorkers; w++) {
        const p = new Promise((resolve, reject) => {
          const child = fork(__filename, [], {
            env: {
              ...process.env,
              WOOBI_WORKER_MODE: '1',
              WORKER_ID: String(w),
              TARGET_COLLECTION: 'wardrobe',
              ITEM_COUNT: String(itemsPerWorker)
            }
          });

          child.on('message', (msg) => {
            if (msg.success) resolve(msg);
            else reject(new Error(`Worker ${w} failed: ${msg.error}`));
          });

          child.on('error', reject);
          child.on('exit', (code) => {
            if (code !== 0) reject(new Error(`Worker ${w} exited with code ${code}`));
          });

          workers.push(child);
        });

        workerPromises.push(p);
      }

      // Await all workers completing their writes
      const results = await Promise.all(workerPromises);
      assert.strictEqual(results.length, numWorkers);

      // Verify master process reads all records from disk
      masterDb.cache.delete('wardrobe_items');
      const allItems = masterDb.wardrobe.getAll();

      // Seed item + (4 workers * 10 items) = 41 items
      assert.strictEqual(allItems.length, totalExpected + 1);

      // Verify each worker's items are intact
      for (let w = 0; w < numWorkers; w++) {
        const workerItems = allItems.filter(i => i.workerId === String(w));
        assert.strictEqual(workerItems.length, itemsPerWorker);
      }
    });

    // 2. Multi-Process Persistent Token Revocation
    it('2. persists revoked tokens across process boundaries and server restarts', async () => {
      const db1 = createDatabaseService({ dataDir: testDataDir });
      const testToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.multiprocess_token_signature';

      // Verify initially not revoked
      assert.strictEqual(await db1.revokedTokens.isRevoked(testToken), false);

      // Revoke in Process 1
      await db1.revokedTokens.revoke(testToken);
      assert.strictEqual(await db1.revokedTokens.isRevoked(testToken), true);

      // Initialize Process 2 pointing to the same data directory
      const db2 = createDatabaseService({ dataDir: testDataDir });
      assert.strictEqual(await db2.revokedTokens.isRevoked(testToken), true);

      // Verify physical disk persistence
      const revokedFile = path.join(testDataDir, 'revoked_tokens.json');
      assert.ok(fs.existsSync(revokedFile));
      const content = JSON.parse(fs.readFileSync(revokedFile, 'utf8'));
      assert.ok(content.some(r => r.token === testToken));
    });

    // 3. Multi-Process Crash Recovery from .bak
    it('3. recovers collection state from .bak backup snapshot when primary file is truncated', async () => {
      const db = createDatabaseService({ dataDir: testDataDir });

      // Create two records to generate .bak copy
      await db.users.create({ id: 'usr_safe_1', email: 'worker1@woobi.com' });
      await db.users.create({ id: 'usr_safe_2', email: 'worker2@woobi.com' });

      const primaryFile = db.getFilePath('users');
      const backupFile = db.getBackupFilePath('users');

      assert.ok(fs.existsSync(primaryFile));
      assert.ok(fs.existsSync(backupFile));

      // Simulate abrupt power failure or crash truncating primary file to invalid JSON
      fs.writeFileSync(primaryFile, '{"incomplete_data_truncation: [', 'utf8');

      // Create fresh database process instance
      const recoveryDb = createDatabaseService({ dataDir: testDataDir });
      let recoveredEvent = null;
      recoveryDb.on(DB_EVENTS.RECOVERED_FROM_BACKUP, (e) => { recoveredEvent = e; });

      const recoveredUsers = recoveryDb.users.getAll();
      assert.ok(recoveredUsers.length >= 1);
      assert.ok(recoveredUsers.some(u => u.id === 'usr_safe_1'));
      assert.ok(recoveredEvent);
      assert.strictEqual(recoveredEvent.collection, 'users');
    });

    // 4. Stale OS Lock Auto-Healing
    it('4. automatically breaks stale OS directory locks older than timeout threshold', async () => {
      const db = createDatabaseService({ dataDir: testDataDir });
      const lockDir = path.join(testDataDir, 'wardrobe_items.oslock');

      // Simulate a crashed process that left behind an orphaned lock directory with an old mtime
      fs.mkdirSync(lockDir, { recursive: true });
      const oldTime = (Date.now() - 15000) / 1000;
      fs.utimesSync(lockDir, oldTime, oldTime);

      // Mutate collection should detect stale lock (> 10s), break it, and succeed
      const record = await db.wardrobe.create({
        userId: 'usr_stale_test',
        name: 'Stale Lock Garment',
        category: 'bottom'
      });

      assert.ok(record);
      assert.strictEqual(record.name, 'Stale Lock Garment');
      assert.ok(!fs.existsSync(lockDir)); // Cleaned up upon release
    });
  });
}
