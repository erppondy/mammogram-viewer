import { StorageService } from '../StorageService';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

describe('StorageService', () => {
  let storageService: StorageService;
  const testStorageRoot = path.join(__dirname, 'test-storage');

  beforeEach(async () => {
    storageService = new StorageService(testStorageRoot);
    await storageService.initialize();
  });

  afterEach(async () => {
    // Clean up test storage
    if (existsSync(testStorageRoot)) {
      await fs.rm(testStorageRoot, { recursive: true, force: true });
    }
  });

  describe('initialize', () => {
    it('should create storage directory structure', async () => {
      expect(existsSync(path.join(testStorageRoot, 'images'))).toBe(true);
      expect(existsSync(path.join(testStorageRoot, 'thumbnails'))).toBe(true);
      expect(existsSync(path.join(testStorageRoot, 'temp', 'uploads'))).toBe(true);
      expect(existsSync(path.join(testStorageRoot, 'temp', 'processing'))).toBe(true);
    });
  });

  describe('saveFile', () => {
    it('should save a file and return relative path', async () => {
      const userId = 'user-123';
      const imageId = 'image-456';
      const buffer = Buffer.from('test image data');
      const extension = 'jpg';

      const relativePath = await storageService.saveFile(userId, imageId, buffer, extension);

      expect(relativePath).toContain('images');
      expect(relativePath).toContain('user-user-123');
      expect(relativePath).toContain(`${imageId}.${extension}`);

      const fullPath = path.join(testStorageRoot, relativePath);
      expect(existsSync(fullPath)).toBe(true);

      const savedData = await fs.readFile(fullPath);
      expect(savedData.toString()).toBe('test image data');
    });

    it('should organize files by year and month', async () => {
      const userId = 'user-123';
      const imageId = 'image-456';
      const buffer = Buffer.from('test data');
      const extension = 'dcm';

      const relativePath = await storageService.saveFile(userId, imageId, buffer, extension);

      const now = new Date();
      const year = now.getFullYear().toString();
      const month = (now.getMonth() + 1).toString().padStart(2, '0');

      expect(relativePath).toContain(year);
      expect(relativePath).toContain(month);
    });
  });

  describe('getFile', () => {
    it('should retrieve a saved file', async () => {
      const userId = 'user-123';
      const imageId = 'image-456';
      const testData = Buffer.from('test image data');
      const extension = 'jpg';

      const relativePath = await storageService.saveFile(userId, imageId, testData, extension);
      const retrievedData = await storageService.getFile(relativePath);

      expect(retrievedData.toString()).toBe('test image data');
    });

    it('should throw error if file does not exist', async () => {
      await expect(storageService.getFile('nonexistent/path.jpg')).rejects.toThrow(
        'File not found'
      );
    });
  });

  describe('deleteFile', () => {
    it('should delete an existing file', async () => {
      const userId = 'user-123';
      const imageId = 'image-456';
      const buffer = Buffer.from('test data');
      const extension = 'jpg';

      const relativePath = await storageService.saveFile(userId, imageId, buffer, extension);
      const fullPath = path.join(testStorageRoot, relativePath);

      expect(existsSync(fullPath)).toBe(true);

      await storageService.deleteFile(relativePath);

      expect(existsSync(fullPath)).toBe(false);
    });

    it('should not throw error if file does not exist', async () => {
      await expect(storageService.deleteFile('nonexistent/path.jpg')).resolves.not.toThrow();
    });
  });

  describe('saveThumbnail', () => {
    it('should save a thumbnail and return relative path', async () => {
      const userId = 'user-123';
      const imageId = 'image-456';
      const buffer = Buffer.from('thumbnail data');

      const relativePath = await storageService.saveThumbnail(userId, imageId, buffer);

      expect(relativePath).toContain('thumbnails');
      expect(relativePath).toContain('user-user-123');
      expect(relativePath).toContain(`${imageId}_thumb.jpg`);

      const fullPath = path.join(testStorageRoot, relativePath);
      expect(existsSync(fullPath)).toBe(true);
    });
  });

  describe('getThumbnail', () => {
    it('should retrieve a saved thumbnail', async () => {
      const userId = 'user-123';
      const imageId = 'image-456';
      const testData = Buffer.from('thumbnail data');

      const relativePath = await storageService.saveThumbnail(userId, imageId, testData);
      const retrievedData = await storageService.getThumbnail(relativePath);

      expect(retrievedData.toString()).toBe('thumbnail data');
    });
  });

  describe('ensureDirectory', () => {
    it('should create directory if it does not exist', async () => {
      const testDir = path.join(testStorageRoot, 'test', 'nested', 'dir');

      await storageService.ensureDirectory(testDir);

      expect(existsSync(testDir)).toBe(true);
    });

    it('should not throw error if directory already exists', async () => {
      const testDir = path.join(testStorageRoot, 'existing-dir');

      await storageService.ensureDirectory(testDir);
      await expect(storageService.ensureDirectory(testDir)).resolves.not.toThrow();
    });
  });

  describe('getStorageStats', () => {
    it('should return storage statistics', async () => {
      // Save some test files
      await storageService.saveFile('user-1', 'img-1', Buffer.from('data1'), 'jpg');
      await storageService.saveFile('user-1', 'img-2', Buffer.from('data2'), 'jpg');
      await storageService.saveThumbnail('user-1', 'img-1', Buffer.from('thumb1'));

      const stats = await storageService.getStorageStats();

      expect(stats.totalSize).toBeGreaterThan(0);
      expect(stats.fileCount).toBe(3);
      expect(stats.availableSpace).toBeGreaterThan(0);
    });
  });

  describe('hasEnoughSpace', () => {
    it('should return true if enough space available', async () => {
      const hasSpace = await storageService.hasEnoughSpace(1024);
      expect(hasSpace).toBe(true);
    });
  });

  describe('cleanupTempFiles', () => {
    it('should delete old temporary files', async () => {
      const tempPath = path.join(testStorageRoot, 'temp', 'uploads');
      const oldFilePath = path.join(tempPath, 'old-file.tmp');

      await fs.writeFile(oldFilePath, 'old data');

      // Modify file time to be older than 24 hours
      const oldTime = Date.now() - 25 * 60 * 60 * 1000;
      await fs.utimes(oldFilePath, new Date(oldTime), new Date(oldTime));

      const deletedCount = await storageService.cleanupTempFiles(24);

      expect(deletedCount).toBe(1);
      expect(existsSync(oldFilePath)).toBe(false);
    });

    it('should not delete recent temporary files', async () => {
      const tempPath = path.join(testStorageRoot, 'temp', 'uploads');
      const recentFilePath = path.join(tempPath, 'recent-file.tmp');

      await fs.writeFile(recentFilePath, 'recent data');

      const deletedCount = await storageService.cleanupTempFiles(24);

      expect(deletedCount).toBe(0);
      expect(existsSync(recentFilePath)).toBe(true);
    });
  });

  describe('chunk operations', () => {
    const sessionId = 'session-123';

    it('should save chunks', async () => {
      const chunk1 = Buffer.from('chunk1');
      const chunk2 = Buffer.from('chunk2');

      await storageService.saveChunk(sessionId, 0, chunk1);
      await storageService.saveChunk(sessionId, 1, chunk2);

      const sessionPath = storageService.getTempUploadPath(sessionId);
      expect(existsSync(path.join(sessionPath, 'chunk_0'))).toBe(true);
      expect(existsSync(path.join(sessionPath, 'chunk_1'))).toBe(true);
    });

    it('should assemble chunks into final buffer', async () => {
      const chunk1 = Buffer.from('Hello ');
      const chunk2 = Buffer.from('World');

      await storageService.saveChunk(sessionId, 0, chunk1);
      await storageService.saveChunk(sessionId, 1, chunk2);

      const assembled = await storageService.assembleChunks(sessionId, 2);

      expect(assembled.toString()).toBe('Hello World');
    });

    it('should cleanup session files', async () => {
      await storageService.saveChunk(sessionId, 0, Buffer.from('data'));

      const sessionPath = storageService.getTempUploadPath(sessionId);
      expect(existsSync(sessionPath)).toBe(true);

      await storageService.cleanupSession(sessionId);

      expect(existsSync(sessionPath)).toBe(false);
    });
  });

  describe('getTempUploadPath', () => {
    it('should return correct temp upload path', () => {
      const sessionId = 'session-123';
      const tempPath = storageService.getTempUploadPath(sessionId);

      expect(tempPath).toContain('temp');
      expect(tempPath).toContain('uploads');
      expect(tempPath).toContain(sessionId);
    });
  });

  describe('getTempProcessingPath', () => {
    it('should return correct temp processing path', () => {
      const tempPath = storageService.getTempProcessingPath();

      expect(tempPath).toContain('temp');
      expect(tempPath).toContain('processing');
    });
  });
});
