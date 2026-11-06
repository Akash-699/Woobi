/**
 * Woobi - 3D Studio Features
 * SavedLooksManager.test.js - Unit & Integration Test Suite for Saved Looks
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { LOOKS_EVENTS, SavedLooksContract } from './SavedLooksContract.js';
import { LookbookStorage } from './LookbookStorage.js';
import {
  SavedLooksManager,
  createSavedLooksManager
} from './SavedLooksManager.js';

// Mock storage environment
const mockStorage = new Map();
globalThis.localStorage = {
  getItem: (key) => mockStorage.get(key) || null,
  setItem: (key, val) => mockStorage.set(key, String(val)),
  removeItem: (key) => mockStorage.delete(key),
  clear: () => mockStorage.clear()
};

describe('Saved Looks Module - Specifications & Contracts', () => {
  beforeEach(() => {
    mockStorage.clear();
  });

  it('1. should export standard lookbook event names', () => {
    assert.strictEqual(LOOKS_EVENTS.SAVED, 'looks:saved');
    assert.strictEqual(LOOKS_EVENTS.DELETED, 'looks:deleted');
    assert.strictEqual(LOOKS_EVENTS.RENAMED, 'looks:renamed');
    assert.strictEqual(LOOKS_EVENTS.LOADED, 'looks:loaded');
  });

  it('2. should satisfy SavedLooksContract API definition', () => {
    assert.strictEqual(SavedLooksContract.name, 'SavedLooksManager');
    assert.ok(Array.isArray(SavedLooksContract.methods));
    assert.ok(SavedLooksContract.methods.includes('saveLook'));
    assert.ok(SavedLooksContract.methods.includes('reEquipLook'));
    assert.ok(SavedLooksContract.methods.includes('exportLooksJSON'));
  });
});

describe('Saved Looks Module - LookbookStorage Driver', () => {
  beforeEach(() => {
    mockStorage.clear();
  });

  it('3. should persist and load looks from localStorage', () => {
    const storage = new LookbookStorage({ primaryKey: 'test_looks' });
    const dummy = [{ id: 'look_1', name: 'Test Look', outfit: { top: 'tank' } }];
    storage.persistLooks(dummy);

    const loaded = storage.loadLooks();
    assert.strictEqual(loaded.length, 1);
    assert.strictEqual(loaded[0].name, 'Test Look');
  });

  it('4. should clear stored looks', () => {
    const storage = new LookbookStorage({ primaryKey: 'test_looks' });
    storage.persistLooks([{ id: 'look_1' }]);
    storage.clear();

    assert.strictEqual(storage.loadLooks().length, 0);
  });
});

describe('Saved Looks Module - Lookbook Operations', () => {
  beforeEach(() => {
    mockStorage.clear();
  });

  it('5. should save a new look with full metadata', () => {
    const manager = createSavedLooksManager();
    const res = manager.saveLook(
      'Editorial Camel',
      { top: 'blazer', bottom: 'taupe_wide', shoes: 'loafers' },
      { skinTone: '#DEB192' },
      ['chic', 'autumn']
    );

    assert.strictEqual(res.success, true);
    assert.ok(res.look.id);
    assert.strictEqual(res.look.name, 'Editorial Camel');
    assert.strictEqual(res.look.outfit.top, 'blazer');
    assert.ok(res.look.createdAt);
  });

  it('6. should reject saving a look with an empty or missing name', () => {
    const manager = createSavedLooksManager();
    const res = manager.saveLook('', { top: 'tank' });
    assert.strictEqual(res.success, false);
    assert.ok(res.error);
  });

  it('7. should query saved looks via getLook', () => {
    const manager = createSavedLooksManager();
    const saved = manager.saveLook('Summer Day', { top: 'tank' });
    const retrieved = manager.getLook(saved.look.id);

    assert.ok(retrieved);
    assert.strictEqual(retrieved.name, 'Summer Day');
  });

  it('8. should return null when querying non-existent look', () => {
    const manager = createSavedLooksManager();
    assert.strictEqual(manager.getLook('unknown_look_id'), null);
  });

  it('9. should return all saved looks via getAllLooks', () => {
    const manager = createSavedLooksManager();
    manager.saveLook('Look 1', { top: 'tank' });
    manager.saveLook('Look 2', { top: 'blazer' });

    const all = manager.getAllLooks();
    assert.strictEqual(all.length, 2);
  });

  it('10. should delete a saved look by ID', () => {
    const manager = createSavedLooksManager();
    const saved = manager.saveLook('To Delete', { top: 'cardigan' });
    const delRes = manager.deleteLook(saved.look.id);

    assert.strictEqual(delRes.success, true);
    assert.strictEqual(manager.getLook(saved.look.id), null);
    assert.strictEqual(manager.getAllLooks().length, 0);
  });

  it('11. should return error when deleting non-existent look', () => {
    const manager = createSavedLooksManager();
    const res = manager.deleteLook('missing_id');
    assert.strictEqual(res.success, false);
  });

  it('12. should rename an existing look', () => {
    const manager = createSavedLooksManager();
    const saved = manager.saveLook('Old Name', { top: 'tank' });

    const renameRes = manager.renameLook(saved.look.id, 'New Fabulous Name');
    assert.strictEqual(renameRes.success, true);
    assert.strictEqual(manager.getLook(saved.look.id).name, 'New Fabulous Name');
  });

  it('13. should reject renaming with invalid input', () => {
    const manager = createSavedLooksManager();
    const saved = manager.saveLook('Valid Look', { top: 'tank' });

    const res = manager.renameLook(saved.look.id, '');
    assert.strictEqual(res.success, false);
  });

  it('14. should enforce maxLooks capacity boundary', () => {
    const manager = createSavedLooksManager({ maxLooks: 2 });
    manager.saveLook('Look 1', { top: 'tank' });
    manager.saveLook('Look 2', { top: 'blazer' });

    const overflow = manager.saveLook('Look 3', { top: 'cardigan' });
    assert.strictEqual(overflow.success, false);
    assert.ok(overflow.error.includes('capacity'));
  });
});

describe('Saved Looks Module - Re-Equip, Export & Events', () => {
  beforeEach(() => {
    mockStorage.clear();
  });

  it('15. should emit looks:saved event on save', () => {
    const manager = createSavedLooksManager();
    let emitted = null;
    manager.on(LOOKS_EVENTS.SAVED, (data) => {
      emitted = data;
    });

    manager.saveLook('Event Look', { top: 'cardigan' });
    assert.ok(emitted);
    assert.strictEqual(emitted.look.name, 'Event Look');
  });

  it('16. should emit looks:deleted event on delete', () => {
    const manager = createSavedLooksManager();
    const saved = manager.saveLook('Event Delete', { top: 'cardigan' });

    let deletedData = null;
    manager.on(LOOKS_EVENTS.DELETED, (data) => {
      deletedData = data;
    });

    manager.deleteLook(saved.look.id);
    assert.ok(deletedData);
    assert.strictEqual(deletedData.id, saved.look.id);
  });

  it('17. should emit looks:renamed event on rename', () => {
    const manager = createSavedLooksManager();
    const saved = manager.saveLook('A', { top: 'tank' });

    let renameData = null;
    manager.on(LOOKS_EVENTS.RENAMED, (data) => {
      renameData = data;
    });

    manager.renameLook(saved.look.id, 'B');
    assert.ok(renameData);
    assert.strictEqual(renameData.oldName, 'A');
    assert.strictEqual(renameData.newName, 'B');
  });

  it('18. should re-equip outfit onto virtual try-on engine', () => {
    const manager = createSavedLooksManager();
    const saved = manager.saveLook('Re-Equip Test', {
      top: 'blazer',
      bottom: 'denim',
      shoes: 'loafers'
    });

    const equippedSlots = {};
    const mockTryOn = {
      equipGarment(category, id) {
        equippedSlots[category] = id;
      }
    };

    const res = manager.reEquipLook(saved.look.id, mockTryOn);
    assert.strictEqual(res.success, true);
    assert.strictEqual(equippedSlots.top, 'blazer');
    assert.strictEqual(equippedSlots.bottom, 'denim');
    assert.strictEqual(equippedSlots.shoes, 'loafers');
  });

  it('19. should re-apply avatar customization config onto customizer', () => {
    const manager = createSavedLooksManager();
    const saved = manager.saveLook('Avatar Test', { top: 'tank' }, {
      skinTone: '#DEB192',
      hairStyle: 'bob'
    });

    let appliedConfig = null;
    const mockCustomizer = {
      applyConfig(cfg) {
        appliedConfig = cfg;
      }
    };

    manager.reEquipLook(saved.look.id, null, mockCustomizer);
    assert.ok(appliedConfig);
    assert.strictEqual(appliedConfig.skinTone, '#DEB192');
    assert.strictEqual(appliedConfig.hairStyle, 'bob');
  });

  it('20. should export looks to clean JSON string', () => {
    const manager = createSavedLooksManager();
    manager.saveLook('Export 1', { top: 'tank' });
    manager.saveLook('Export 2', { top: 'blazer' });

    const json = manager.exportLooksJSON();
    assert.ok(typeof json === 'string');
    const parsed = JSON.parse(json);
    assert.strictEqual(parsed.length, 2);
    assert.strictEqual(parsed[0].name, 'Export 1');
  });

  it('21. should import looks from valid JSON string', () => {
    const manager = createSavedLooksManager();
    const testJson = JSON.stringify([
      { name: 'Imported A', outfit: { top: 'striped_sweater' } },
      { name: 'Imported B', outfit: { top: 'navy_shirt' } }
    ]);

    const res = manager.importLooksJSON(testJson);
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.importedCount, 2);
    assert.strictEqual(manager.getAllLooks().length, 2);
  });

  it('22. should reject importing malformed JSON string', () => {
    const manager = createSavedLooksManager();
    const res = manager.importLooksJSON('{ not an array }');
    assert.strictEqual(res.success, false);
  });

  it('23. should clear all looks with clearAllLooks', () => {
    const manager = createSavedLooksManager();
    manager.saveLook('A', { top: 'tank' });
    manager.saveLook('B', { top: 'blazer' });

    manager.clearAllLooks();
    assert.strictEqual(manager.getAllLooks().length, 0);
  });

  it('24. should persist looks to localStorage automatically when autoPersist is true', () => {
    const manager = createSavedLooksManager();
    manager.saveLook('Persist Check', { top: 'tank' });

    const raw = mockStorage.get('woobi_saved_looks_v1');
    assert.ok(raw);
    assert.strictEqual(JSON.parse(raw)[0].name, 'Persist Check');
  });

  it('25. should restore looks from localStorage on new manager instantiation', () => {
    mockStorage.set('woobi_saved_looks_v1', JSON.stringify([
      { id: 'look_persisted', name: 'Restored Look', outfit: { top: 'blazer' } }
    ]));

    const manager = createSavedLooksManager();
    assert.strictEqual(manager.getAllLooks().length, 1);
    assert.strictEqual(manager.getLook('look_persisted').name, 'Restored Look');
  });

  it('26. should clean up listeners and maps on dispose', () => {
    const manager = createSavedLooksManager();
    manager.saveLook('Cleanup Test', { top: 'tank' });

    manager.dispose();
    assert.strictEqual(manager.getAllLooks().length, 0);
  });
});
