import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { StorageService, createStorageService, STORAGE_CONSTRAINTS, STORAGE_EVENTS } from './index.js';

// Helper to create synthetic valid image buffers
function createMockPngBuffer(size = 64) {
  const buf = Buffer.alloc(Math.max(16, size));
  // PNG Magic Header: 89 50 4E 47 0D 0A 1A 0A
  [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A].forEach((b, i) => { buf[i] = b; });
  return buf;
}

function createMockJpegBuffer(size = 64) {
  const buf = Buffer.alloc(Math.max(16, size));
  // JPEG Magic Header: FF D8 FF
  [0xFF, 0xD8, 0xFF].forEach((b, i) => { buf[i] = b; });
  return buf;
}

function createMockWebpBuffer(size = 64) {
  const buf = Buffer.alloc(Math.max(16, size));
  // RIFF header
  [0x52, 0x49, 0x46, 0x46].forEach((b, i) => { buf[i] = b; });
  // WEBP at offset 8
  [0x57, 0x45, 0x42, 0x50].forEach((b, i) => { buf[i + 8] = b; });
  return buf;
}

function createMockExecutableBuffer(size = 64) {
  const buf = Buffer.alloc(Math.max(16, size));
  // DOS MZ Header: 4D 5A
  buf[0] = 0x4D;
  buf[1] = 0x5A;
  return buf;
}

describe('Storage Submodule - StorageService', () => {
  let storage;

  beforeEach(() => {
    storage = createStorageService({ inMemoryOnly: true });
  });

  // 1. Magic Sniffing - PNG
  it('1. identifies genuine PNG buffers by magic bytes', () => {
    const buf = createMockPngBuffer();
    assert.strictEqual(storage.sniffMimeType(buf), 'image/png');
  });

  // 2. Magic Sniffing - JPEG
  it('2. identifies genuine JPEG buffers by magic bytes', () => {
    const buf = createMockJpegBuffer();
    assert.strictEqual(storage.sniffMimeType(buf), 'image/jpeg');
  });

  // 3. Magic Sniffing - WebP
  it('3. identifies genuine WebP buffers by magic bytes', () => {
    const buf = createMockWebpBuffer();
    assert.strictEqual(storage.sniffMimeType(buf), 'image/webp');
  });

  // 4. Magic Sniffing - Executable / Unknown
  it('4. returns null when sniffing unknown or executable binary files', () => {
    const exeBuf = createMockExecutableBuffer();
    assert.strictEqual(storage.sniffMimeType(exeBuf), null);
  });

  // 5. Upload Validation - Valid PNG
  it('5. validates genuine PNG file buffer', () => {
    const buf = createMockPngBuffer();
    const res = storage.validateUpload(buf, 'image/png');
    assert.strictEqual(res.valid, true);
    assert.strictEqual(res.detectedMime, 'image/png');
  });

  // 6. Upload Validation - File Too Small
  it('6. rejects empty or incomplete file buffers (<16 bytes)', () => {
    const tiny = Buffer.from([0x89, 0x50]);
    const res = storage.validateUpload(tiny);
    assert.strictEqual(res.valid, false);
    assert.ok(res.error.includes('too small'));
  });

  // 7. Upload Validation - Exceeds 10MB Limit
  it('7. rejects uploads exceeding maximum configured file size (10MB)', () => {
    const huge = Buffer.alloc(11 * 1024 * 1024);
    // Mark as PNG
    [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A].forEach((b, i) => { huge[i] = b; });

    const res = storage.validateUpload(huge);
    assert.strictEqual(res.valid, false);
    assert.ok(res.error.includes('exceeds 10MB'));
  });

  // 8. Upload Validation - Executable Spoofed as Image
  it('8. detects and rejects executable file masquerading as image', () => {
    const spoofed = createMockExecutableBuffer();
    const res = storage.validateUpload(spoofed, 'image/png');
    assert.strictEqual(res.valid, false);
    assert.ok(res.error.includes('disallowed'));
  });

  // 9. Upload Event - Rejection Event Emission
  it('9. emits storage:rejected_mime event when disallowed file uploaded', () => {
    let eventData = null;
    storage.on(STORAGE_EVENTS.REJECTED_MIME, (d) => { eventData = d; });

    const spoofed = createMockExecutableBuffer();
    storage.validateUpload(spoofed, 'image/jpeg');

    assert.ok(eventData);
    assert.strictEqual(eventData.declared, 'image/jpeg');
  });

  // 10. Save User File - Successful Save
  it('10. saves valid image into user storage and returns access metadata', async () => {
    const buf = createMockPngBuffer();
    const res = await storage.saveUserFile('usr_1', 'my_wardrobe.png', buf);

    assert.strictEqual(res.success, true);
    assert.ok(res.file.filename.endsWith('.png'));
    assert.strictEqual(res.file.mimeType, 'image/png');
    assert.ok(res.file.url.includes('/api/storage/files/'));
  });

  // 11. Save User File - Missing User ID
  it('11. rejects file saving when userId is missing', async () => {
    const buf = createMockPngBuffer();
    const res = await storage.saveUserFile(null, 'photo.png', buf);
    assert.strictEqual(res.success, false);
    assert.ok(res.error.includes('User ID'));
  });

  // 12. Save User File - Event Emission
  it('12. emits storage:file_uploaded event upon successful save', async () => {
    let eventReceived = null;
    storage.on(STORAGE_EVENTS.FILE_UPLOADED, (d) => { eventReceived = d; });

    const buf = createMockJpegBuffer();
    await storage.saveUserFile('usr_2', 'shirt.jpg', buf);

    assert.ok(eventReceived);
    assert.strictEqual(eventReceived.userId, 'usr_2');
    assert.ok(eventReceived.filename.endsWith('.jpg'));
  });

  // 13. File Retrieval - Authorized Owner
  it('13. retrieves stored file buffer and correct MIME type for owner', async () => {
    const buf = createMockPngBuffer();
    const saved = await storage.saveUserFile('usr_3', 'denim.png', buf);

    const retrieved = await storage.getFile('usr_3', saved.file.filename);
    assert.strictEqual(retrieved.found, true);
    assert.strictEqual(retrieved.mimeType, 'image/png');
    assert.strictEqual(retrieved.buffer.length, buf.length);
  });

  // 14. File Retrieval - Cross-User Isolation (User B cannot fetch User A file)
  it('14. prevents cross-user file retrieval (User B cannot read User A file)', async () => {
    const buf = createMockPngBuffer();
    const saved = await storage.saveUserFile('usr_owner', 'private_look.png', buf);

    // Attempted retrieval by another user
    const crossUserGet = await storage.getFile('usr_attacker', saved.file.filename);
    assert.strictEqual(crossUserGet.found, false);
    assert.strictEqual(crossUserGet.buffer, null);
  });

  // 15. File Retrieval - Path Traversal Prevention in Filename
  it('15. rejects filenames containing directory traversal characters (../)', async () => {
    const res = await storage.getFile('usr_1', '../../etc/passwd');
    assert.strictEqual(res.found, false);
  });

  // 16. File Retrieval - Non-existent File
  it('16. returns found: false when file does not exist', async () => {
    const res = await storage.getFile('usr_1', 'nonexistent_file.png');
    assert.strictEqual(res.found, false);
  });

  // 17. File Deletion - Authorized Owner
  it('17. deletes stored file when requested by owner', async () => {
    const buf = createMockPngBuffer();
    const saved = await storage.saveUserFile('usr_4', 'trash.png', buf);

    const deleted = await storage.deleteFile('usr_4', saved.file.filename);
    assert.strictEqual(deleted, true);

    const check = await storage.getFile('usr_4', saved.file.filename);
    assert.strictEqual(check.found, false);
  });

  // 18. File Deletion - Cross-User Block
  it('18. prevents unauthorized deletion of files owned by another user', async () => {
    const buf = createMockPngBuffer();
    const saved = await storage.saveUserFile('usr_owner', 'keep.png', buf);

    const deleted = await storage.deleteFile('usr_other', saved.file.filename);
    assert.strictEqual(deleted, false);

    const check = await storage.getFile('usr_owner', saved.file.filename);
    assert.strictEqual(check.found, true);
  });

  // 19. File Deletion - Event Emission
  it('19. emits storage:file_deleted event on file removal', async () => {
    let deleteData = null;
    storage.on(STORAGE_EVENTS.FILE_DELETED, (d) => { deleteData = d; });

    const buf = createMockJpegBuffer();
    const saved = await storage.saveUserFile('usr_5', 'todelete.jpg', buf);
    await storage.deleteFile('usr_5', saved.file.filename);

    assert.ok(deleteData);
    assert.strictEqual(deleteData.userId, 'usr_5');
  });

  // 20. Traversal Block Event Emission
  it('20. emits storage:traversal_blocked event on traversal attempt', async () => {
    let blockData = null;
    storage.on(STORAGE_EVENTS.TRAVERSAL_BLOCKED, (d) => { blockData = d; });

    await storage.getFile('usr_1', '../evil.png');
    assert.ok(blockData);
    assert.strictEqual(blockData.filename, '../evil.png');
  });

  // 21. Non-Buffer Upload Rejection
  it('21. returns error when upload payload is not a Buffer', () => {
    const res = storage.validateUpload('string instead of buffer');
    assert.strictEqual(res.valid, false);
    assert.ok(res.error.includes('Buffer'));
  });

  // 22. Safe Handling of Empty Filename in deleteFile
  it('22. safely returns false when deleting with empty filename or userId', async () => {
    assert.strictEqual(await storage.deleteFile(null, 'file.png'), false);
    assert.strictEqual(await storage.deleteFile('usr_1', ''), false);
  });

  // 23. WebP Upload and Retrieval
  it('23. supports full WebP lifecycle upload and retrieval', async () => {
    const buf = createMockWebpBuffer();
    const saved = await storage.saveUserFile('usr_webp', 'pic.webp', buf);

    assert.strictEqual(saved.success, true);
    assert.ok(saved.file.filename.endsWith('.webp'));
    assert.strictEqual(saved.file.mimeType, 'image/webp');

    const getRes = await storage.getFile('usr_webp', saved.file.filename);
    assert.strictEqual(getRes.found, true);
    assert.strictEqual(getRes.mimeType, 'image/webp');
  });

  // 24. Sanitization of User File Extension
  it('24. generates safe randomized filenames preventing collision', async () => {
    const buf = createMockPngBuffer();
    const res1 = await storage.saveUserFile('usr_1', 'same_name.png', buf);
    const res2 = await storage.saveUserFile('usr_1', 'same_name.png', buf);

    assert.notStrictEqual(res1.file.filename, res2.file.filename);
  });

  // 25. Event Subscriber Exception Resiliency
  it('25. does not crash storage operation if an event listener throws an exception', async () => {
    storage.on(STORAGE_EVENTS.FILE_UPLOADED, () => {
      throw new Error('Listener crash');
    });

    const buf = createMockJpegBuffer();
    const res = await storage.saveUserFile('usr_1', 'resilient.jpg', buf);
    assert.strictEqual(res.success, true);
  });
});
