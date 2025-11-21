import fs from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';

export interface StorageStats {
    totalSize: number;
    availableSpace: number;
    fileCount: number;
}

export class StorageService {
    private storageRoot: string;

    constructor(storageRoot?: string) {
        this.storageRoot = storageRoot || process.env.STORAGE_ROOT || './storage';
    }

    /**
     * Initialize storage directory structure
     */
    async initialize(): Promise<void> {
        await this.ensureDirectory(this.storageRoot);
        await this.ensureDirectory(path.join(this.storageRoot, 'images'));
        await this.ensureDirectory(path.join(this.storageRoot, 'thumbnails'));
        await this.ensureDirectory(path.join(this.storageRoot, 'temp', 'uploads'));
        await this.ensureDirectory(path.join(this.storageRoot, 'temp', 'processing'));
    }

    /**
     * Save a file to storage
     */
    async saveFile(
        userId: string,
        imageId: string,
        buffer: Buffer,
        extension: string
    ): Promise<string> {
        const now = new Date();
        const year = now.getFullYear().toString();
        const month = (now.getMonth() + 1).toString().padStart(2, '0');

        const userDir = `user-${userId}`;
        const relativePath = path.join('images', userDir, year, month);
        const fullPath = path.join(this.storageRoot, relativePath);

        await this.ensureDirectory(fullPath);

        const filename = `${imageId}.${extension}`;
        const filePath = path.join(fullPath, filename);

        await fs.writeFile(filePath, buffer);

        // Return relative path from storage root
        return path.join(relativePath, filename);
    }

    /**
     * Get a file from storage
     */
    async getFile(storagePath: string): Promise<Buffer> {
        const fullPath = path.join(this.storageRoot, storagePath);

        if (!existsSync(fullPath)) {
            throw new Error(`File not found: ${storagePath}`);
        }

        return await fs.readFile(fullPath);
    }

    /**
     * Delete a file from storage
     */
    async deleteFile(storagePath: string): Promise<void> {
        const fullPath = path.join(this.storageRoot, storagePath);

        if (existsSync(fullPath)) {
            await fs.unlink(fullPath);
        }
    }

    /**
     * Save a thumbnail
     */
    async saveThumbnail(userId: string, imageId: string, buffer: Buffer): Promise<string> {
        const now = new Date();
        const year = now.getFullYear().toString();
        const month = (now.getMonth() + 1).toString().padStart(2, '0');

        const userDir = `user-${userId}`;
        const relativePath = path.join('thumbnails', userDir, year, month);
        const fullPath = path.join(this.storageRoot, relativePath);

        await this.ensureDirectory(fullPath);

        const filename = `${imageId}_thumb.jpg`;
        const filePath = path.join(fullPath, filename);

        await fs.writeFile(filePath, buffer);

        return path.join(relativePath, filename);
    }

    /**
     * Get a thumbnail from storage
     */
    async getThumbnail(thumbnailPath: string): Promise<Buffer> {
        return await this.getFile(thumbnailPath);
    }

    /**
     * Generate and save thumbnail for an image
     */
    async generateThumbnail(
        userId: string,
        imageId: string,
        imageBuffer: Buffer,
        _extension: string
    ): Promise<string> {
        try {
            const sharp = (await import('sharp')).default;
            
            // Generate 300x300 thumbnail
            const thumbnailBuffer = await sharp(imageBuffer)
                .resize(300, 300, {
                    fit: 'inside',
                    withoutEnlargement: true,
                })
                .jpeg({ quality: 80 })
                .toBuffer();

            return await this.saveThumbnail(userId, imageId, thumbnailBuffer);
        } catch (error) {
            console.error('Thumbnail generation error:', error);
            throw new Error('Failed to generate thumbnail');
        }
    }

    /**
     * Ensure a directory exists, create if it doesn't
     */
    async ensureDirectory(dirPath: string): Promise<void> {
        if (!existsSync(dirPath)) {
            await fs.mkdir(dirPath, { recursive: true, mode: 0o750 });
        }
    }

    /**
     * Get storage statistics
     */
    async getStorageStats(): Promise<StorageStats> {
        const imagesPath = path.join(this.storageRoot, 'images');
        const thumbnailsPath = path.join(this.storageRoot, 'thumbnails');

        let totalSize = 0;
        let fileCount = 0;

        // Calculate size and count for images
        if (existsSync(imagesPath)) {
            const imageStats = await this.calculateDirectorySize(imagesPath);
            totalSize += imageStats.size;
            fileCount += imageStats.count;
        }

        // Calculate size and count for thumbnails
        if (existsSync(thumbnailsPath)) {
            const thumbnailStats = await this.calculateDirectorySize(thumbnailsPath);
            totalSize += thumbnailStats.size;
            fileCount += thumbnailStats.count;
        }

        // Get available space (this is a simplified version)
        // In production, you'd use a library like 'check-disk-space'
        const availableSpace = await this.getAvailableSpace();

        return {
            totalSize,
            availableSpace,
            fileCount,
        };
    }

    /**
     * Calculate total size and file count in a directory recursively
     */
    private async calculateDirectorySize(
        dirPath: string
    ): Promise<{ size: number; count: number }> {
        let totalSize = 0;
        let fileCount = 0;

        const entries = await fs.readdir(dirPath, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(dirPath, entry.name);

            if (entry.isDirectory()) {
                const subStats = await this.calculateDirectorySize(fullPath);
                totalSize += subStats.size;
                fileCount += subStats.count;
            } else if (entry.isFile()) {
                const stats = await fs.stat(fullPath);
                totalSize += stats.size;
                fileCount++;
            }
        }

        return { size: totalSize, count: fileCount };
    }

    /**
     * Get available disk space
     */
    private async getAvailableSpace(): Promise<number> {
        // Simplified implementation - returns a large number
        // In production, use 'check-disk-space' package
        return 1024 * 1024 * 1024 * 100; // 100GB placeholder
    }

    /**
     * Check if there's enough disk space for a file
     */
    async hasEnoughSpace(requiredBytes: number): Promise<boolean> {
        const stats = await this.getStorageStats();
        return stats.availableSpace >= requiredBytes;
    }

    /**
     * Clean up temporary files older than specified hours
     */
    async cleanupTempFiles(olderThanHours: number = 24): Promise<number> {
        const tempPath = path.join(this.storageRoot, 'temp');
        if (!existsSync(tempPath)) {
            return 0;
        }

        const cutoffTime = Date.now() - olderThanHours * 60 * 60 * 1000;
        let deletedCount = 0;

        const cleanDirectory = async (dirPath: string): Promise<void> => {
            const entries = await fs.readdir(dirPath, { withFileTypes: true });

            for (const entry of entries) {
                const fullPath = path.join(dirPath, entry.name);

                if (entry.isDirectory()) {
                    await cleanDirectory(fullPath);
                    // Try to remove directory if empty
                    try {
                        await fs.rmdir(fullPath);
                    } catch {
                        // Directory not empty, ignore
                    }
                } else if (entry.isFile()) {
                    const stats = await fs.stat(fullPath);
                    if (stats.mtimeMs < cutoffTime) {
                        await fs.unlink(fullPath);
                        deletedCount++;
                    }
                }
            }
        };

        await cleanDirectory(tempPath);
        return deletedCount;
    }

    /**
     * Get temporary upload directory for a session
     */
    getTempUploadPath(sessionId: string): string {
        return path.join(this.storageRoot, 'temp', 'uploads', sessionId);
    }

    /**
     * Get temporary processing directory
     */
    getTempProcessingPath(): string {
        return path.join(this.storageRoot, 'temp', 'processing');
    }

    /**
     * Save chunk to temporary location
     */
    async saveChunk(sessionId: string, chunkIndex: number, buffer: Buffer): Promise<string> {
        const sessionPath = this.getTempUploadPath(sessionId);
        await this.ensureDirectory(sessionPath);

        const chunkPath = path.join(sessionPath, `chunk_${chunkIndex}`);
        await fs.writeFile(chunkPath, buffer);

        return chunkPath;
    }

    /**
     * Assemble chunks into final file
     */
    async assembleChunks(sessionId: string, totalChunks: number): Promise<Buffer> {
        const sessionPath = this.getTempUploadPath(sessionId);
        const chunks: Buffer[] = [];

        for (let i = 0; i < totalChunks; i++) {
            const chunkPath = path.join(sessionPath, `chunk_${i}`);
            const chunkBuffer = await fs.readFile(chunkPath);
            chunks.push(chunkBuffer);
        }

        return Buffer.concat(chunks);
    }

    /**
     * Clean up session temporary files
     */
    async cleanupSession(sessionId: string): Promise<void> {
        const sessionPath = this.getTempUploadPath(sessionId);
        if (existsSync(sessionPath)) {
            await fs.rm(sessionPath, { recursive: true, force: true });
        }
    }
}

// Export singleton instance
export const storageService = new StorageService();
