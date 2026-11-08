/**
 * Woobi - Backend Module
 * DatabaseContract.js - Entity Schemas, Validation Rules & Database Events
 */

export const DB_ENTITIES = {
  USERS: 'users',
  WARDROBE_ITEMS: 'wardrobe_items',
  SAVED_LOOKS: 'saved_looks',
  AVATAR_PREFERENCES: 'avatar_preferences',
  USER_SETTINGS: 'user_settings',
  STREAK_RECORDS: 'streak_records',
  SUBSCRIPTIONS: 'subscriptions',
  REVOKED_TOKENS: 'revoked_tokens'
};

export const DB_EVENTS = {
  ENTITY_CREATED: 'db:entity_created',
  ENTITY_UPDATED: 'db:entity_updated',
  ENTITY_DELETED: 'db:entity_deleted',
  MIGRATION_APPLIED: 'db:migration_applied',
  CORRUPTION_DETECTED: 'db:corruption_detected',
  RECOVERED_FROM_BACKUP: 'db:recovered_from_backup',
  TRANSACTION_COMMITTED: 'db:transaction_committed',
  TRANSACTION_ROLLED_BACK: 'db:transaction_rolled_back'
};

export const DatabaseContract = {
  entities: DB_ENTITIES,
  events: DB_EVENTS
};

export default DatabaseContract;
