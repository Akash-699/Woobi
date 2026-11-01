/**
 * Woobi - Backend Module
 * StorageService.js - Secure Uploads, Magic Number Sniffing & Isolated User Storage
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { STORAGE_CONSTRAINTS, STORAGE_EVENTS } from './StorageContract.js';

export class StorageService {
  constructor(options = {}) {
    this.options = {
      baseDir: path.resolve('uploads'),
      inMemoryOnly: false,
      ...options
    };

    this.memFiles = new Map(); // key: `${userId}:${filename}` -> { buffer, mimeType, size }
    this.listeners = new Map();

    if (!this.options.inMemoryOnly && !fs.existsSync(this.options.baseDir)) {
      try {
        fs.mkdirSync(this.options.baseDir, { recursive: true });
      } catch (err) {
        console.warn('StorageService: falling back to in-memory mode', err.message);
        this.options.inMemoryOnly = true;
      }
    }
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
          console.error(`StorageService event error [${event}]:`, err);
        }
      }
    }
  }

  /**
   * Sniffs the true MIME type from initial buffer bytes
   * @param {Buffer} buffer 
   * @returns {string | null} Detected MIME type or null
   */
  sniffMimeType(buffer) {
    if (!Buffer.isBuffer(buffer) || buffer.length < 12) return null;

    const magic = STORAGE_CONSTRAINTS.MAGIC_NUMBERS;

    // Check PNG
    if (buffer.length >= 8 && magic.PNG.every((byte, idx) => buffer[idx] === byte)) {
      return 'image/png';
    }

    // Check JPEG
    if (buffer.length >= 3 && magic.JPEG.every((byte, idx) => buffer[idx] === byte)) {
      return 'image/jpeg';
    }

    // Check WebP (RIFF....WEBP)
    if (buffer.length >= 12 &&
        magic.RIFF.every((byte, idx) => buffer[idx] === byte) &&
        magic.WEBP.every((byte, idx) => buffer[idx + 8] === byte)) {
      return 'image/webp';
    }

    return null;
  }

  /**
   * Validates binary buffer against size limits and true magic-byte signature
   * @param {Buffer} buffer 
   * @param {string} declaredMime 
   * @returns {{ valid: boolean, detectedMime: string | null, error: string | null }}
   */
  validateUpload(buffer, declaredMime = '') {
    if (!Buffer.isBuffer(buffer)) {
      return { valid: false, detectedMime: null, error: 'Upload payload must be a binary Buffer' };
    }

    if (buffer.length < STORAGE_CONSTRAINTS.MIN_FILE_SIZE_BYTES) {
      return { valid: false, detectedMime: null, error: 'File is too small or empty' };
    }

    if (buffer.length > STORAGE_CONSTRAINTS.MAX_FILE_SIZE_BYTES) {
      this.emit(STORAGE_EVENTS.REJECTED_SIZE, { size: buffer.length });
      return { valid: false, detectedMime: null, error: 'File size exceeds 10MB limit' };
    }

    const detected = this.sniffMimeType(buffer);
    if (!detected || !STORAGE_CONSTRAINTS.ALLOWED_MIME_TYPES.includes(detected)) {
      this.emit(STORAGE_EVENTS.REJECTED_MIME, { declared: declaredMime, detected });
      return { valid: false, detectedMime: null, error: 'File type spoofed or disallowed. Only genuine JPEG, PNG, and WebP are allowed' };
    }

    return { valid: true, detectedMime: detected, error: null };
  }

  /**
   * Saves a user-uploaded image into user-isolated storage
   * @param {string} userId Owner's authenticated ID
   * @param {string} originalName Original filename
   * @param {Buffer} buffer Binary data
   * @returns {{ success: boolean, file?: object, error?: string }}
   */
  async saveUserFile(userId, originalName, buffer) {
    if (!userId || typeof userId !== 'string') {
      return { success: false, error: 'User ID is required' };
    }

    const validation = this.validateUpload(buffer);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    const extMap = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp'
    };
    const ext = extMap[validation.detectedMime] || '.bin';
    const safeFilename = `${Date.now()}_${crypto.randomBytes(6).toString('hex')}${ext}`;

    if (this.options.inMemoryOnly) {
      const key = `${userId}:${safeFilename}`;
      this.memFiles.set(key, {
        userId,
        filename: safeFilename,
        buffer,
        mimeType: validation.detectedMime,
        size: buffer.length,
        createdAt: new Date().toISOString()
      });

      this.emit(STORAGE_EVENTS.FILE_UPLOADED, { userId, filename: safeFilename });
      return {
        success: true,
        file: {
          filename: safeFilename,
          mimeType: validation.detectedMime,
          size: buffer.length,
          url: `/api/storage/files/${safeFilename}`
        }
      };
    }

    // Isolated user directory
    const userDir = path.join(this.options.baseDir, userId);
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }

    const destPath = path.join(userDir, safeFilename);
    fs.writeFileSync(destPath, buffer);

    this.emit(STORAGE_EVENTS.FILE_UPLOADED, { userId, filename: safeFilename });
    return {
      success: true,
      file: {
        filename: safeFilename,
        mimeType: validation.detectedMime,
        size: buffer.length,
        url: `/api/storage/files/${safeFilename}`
      }
    };
  }

  /**
   * Retrieves a user file ensuring access authorization
   * @param {string} userId 
   * @param {string} filename 
   * @returns {{ found: boolean, buffer: Buffer | null, mimeType: string | null }}
   */
  async getFile(userId, filename) {
    if (!userId || !filename) return { found: false, buffer: null, mimeType: null };

    // Prevent directory traversal inside filename
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\') || filename.includes('\0')) {
      this.emit(STORAGE_EVENTS.TRAVERSAL_BLOCKED, { userId, filename });
      return { found: false, buffer: null, mimeType: null };
    }

    if (this.options.inMemoryOnly) {
      const key = `${userId}:${filename}`;
      const record = this.memFiles.get(key);
      if (!record) return { found: false, buffer: null, mimeType: null };
      return { found: true, buffer: record.buffer, mimeType: record.mimeType };
    }

    const filePath = path.join(this.options.baseDir, userId, filename);
    if (!fs.existsSync(filePath)) {
      return { found: false, buffer: null, mimeType: null };
    }

    const buffer = fs.readFileSync(filePath);
    const mimeType = this.sniffMimeType(buffer) || 'application/octet-stream';
    return { found: true, buffer, mimeType };
  }

  /**
   * Deletes a user file safely
   * @param {string} userId 
   * @param {string} filename 
   * @returns {boolean} True if deleted
   */
  async deleteFile(userId, filename) {
    if (!userId || !filename) return false;

    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return false;
    }

    if (this.options.inMemoryOnly) {
      const key = `${userId}:${filename}`;
      const deleted = this.memFiles.delete(key);
      if (deleted) {
        this.emit(STORAGE_EVENTS.FILE_DELETED, { userId, filename });
      }
      return deleted;
    }

    const filePath = path.join(this.options.baseDir, userId, filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      this.emit(STORAGE_EVENTS.FILE_DELETED, { userId, filename });
      return true;
    }

    return false;
  }
}

export function createStorageService(options = {}) {
  return new StorageService(options);
}

export default StorageService;
