/**
 * Woobi - Backend Module
 * StorageContract.js - File Upload Rules, MIME Magic Numbers & Storage Events
 */

export const STORAGE_CONSTRAINTS = {
  MAX_FILE_SIZE_BYTES: 10 * 1024 * 1024, // 10MB
  MIN_FILE_SIZE_BYTES: 16, // At least 16 bytes for valid header

  ALLOWED_MIME_TYPES: [
    'image/jpeg',
    'image/png',
    'image/webp'
  ],

  ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.webp'],

  // True binary file signatures (magic bytes)
  MAGIC_NUMBERS: {
    JPEG: [0xFF, 0xD8, 0xFF],
    PNG: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A],
    RIFF: [0x52, 0x49, 0x46, 0x46], // WebP header starts with RIFF
    WEBP: [0x57, 0x45, 0x42, 0x50]  // WebP bytes 8-11
  }
};

export const STORAGE_EVENTS = {
  FILE_UPLOADED: 'storage:file_uploaded',
  FILE_DELETED: 'storage:file_deleted',
  REJECTED_MIME: 'storage:rejected_mime',
  REJECTED_SIZE: 'storage:rejected_size',
  TRAVERSAL_BLOCKED: 'storage:traversal_blocked'
};

export const StorageContract = {
  constraints: STORAGE_CONSTRAINTS,
  events: STORAGE_EVENTS
};

export default StorageContract;
