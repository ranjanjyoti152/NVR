const fs = require('fs').promises;
const path = require('path');
const disk = require('check-disk-space').default;
const baseLogger = require('../utils/baseLogger');
const Settings = require('../models/Settings');
const Recording = require('../models/Recording');

class StorageService {
    constructor() {
        this.storagePath = process.env.STORAGE_PATH;
        this.initialized = false;
    }

    async initialize() {
        try {
            // Create storage directories if they don't exist
            const directories = [
                '',
                'recordings',
                'thumbnails',
                'temp'
            ];

            for (const dir of directories) {
                const dirPath = path.join(this.storagePath, dir);
                await fs.mkdir(dirPath, { recursive: true });
                baseLogger.info(`Created directory: ${dirPath}`);
            }

            this.initialized = true;
            baseLogger.info('Storage service initialized successfully');
        } catch (error) {
            baseLogger.error('Failed to initialize storage service:', error);
            throw error;
        }
    }

    async getStorageInfo() {
        try {
            const diskSpace = await disk(this.storagePath);
            const settings = await Settings.getSettings();
            const maxSize = settings.storage.maxSize * 1024 * 1024 * 1024; // Convert GB to bytes

            // Calculate used space
            const used = diskSpace.size - diskSpace.free;
            const usedGB = Math.round(used / (1024 * 1024 * 1024));
            const totalGB = Math.round(diskSpace.size / (1024 * 1024 * 1024));
            const freeGB = Math.round(diskSpace.free / (1024 * 1024 * 1024));

            return {
                total: totalGB,
                used: usedGB,
                free: freeGB,
                unit: 'GB',
                settings: {
                    maxSize: settings.storage.maxSize,
                    cleanupThreshold: settings.storage.cleanupThreshold,
                    retentionDays: settings.storage.retentionDays,
                    path: settings.storage.path
                }
            };
        } catch (error) {
            baseLogger.error('Failed to get storage info:', error);
            throw error;
        }
    }

    async performCleanup() {
        try {
            const settings = await Settings.getSettings();
            const storageInfo = await this.getStorageInfo();
            const results = {
                spaceFreed: 0,
                filesDeleted: 0,
                errors: []
            };

            // Check if cleanup is needed
            if (storageInfo.used < settings.storage.cleanupThreshold) {
                return {
                    ...results,
                    message: 'Cleanup not needed'
                };
            }

            // Get old recordings
            const retentionDate = new Date();
            retentionDate.setDate(retentionDate.getDate() - settings.storage.retentionDays);

            const oldRecordings = await Recording.find({
                startTime: { $lt: retentionDate },
                status: 'completed'
            }).sort({ startTime: 1 });

            // Delete old recordings
            for (const recording of oldRecordings) {
                try {
                    const filePath = path.join(this.storagePath, recording.filePath);
                    const thumbnailPath = recording.thumbnailPath ? 
                        path.join(this.storagePath, recording.thumbnailPath) : null;

                    // Get file size before deletion
                    const stats = await fs.stat(filePath);
                    results.spaceFreed += stats.size;

                    // Delete recording file
                    await fs.unlink(filePath);

                    // Delete thumbnail if exists
                    if (thumbnailPath) {
                        await fs.unlink(thumbnailPath);
                    }

                    // Delete recording document
                    await recording.remove();

                    results.filesDeleted++;

                    // Check if we've freed enough space
                    if (storageInfo.used - (results.spaceFreed / (1024 * 1024 * 1024)) < 
                        settings.storage.cleanupThreshold) {
                        break;
                    }
                } catch (error) {
                    results.errors.push({
                        recordingId: recording._id,
                        error: error.message
                    });
                }
            }

            baseLogger.info(`Storage cleanup completed: ${results.filesDeleted} files deleted, ${Math.round(results.spaceFreed / (1024 * 1024 * 1024))}GB freed`);
            return results;
        } catch (error) {
            baseLogger.error('Failed to perform storage cleanup:', error);
            throw error;
        }
    }

    async saveRecording(stream, filename) {
        try {
            const filePath = path.join(this.storagePath, 'recordings', filename);
            const writeStream = fs.createWriteStream(filePath);

            return new Promise((resolve, reject) => {
                stream.pipe(writeStream);
                stream.on('end', () => resolve(filePath));
                stream.on('error', reject);
                writeStream.on('error', reject);
            });
        } catch (error) {
            baseLogger.error('Failed to save recording:', error);
            throw error;
        }
    }

    async deleteRecording(filePath) {
        try {
            const fullPath = path.join(this.storagePath, filePath);
            await fs.unlink(fullPath);
            baseLogger.info(`Deleted recording: ${filePath}`);
            return true;
        } catch (error) {
            if (error.code === 'ENOENT') {
                baseLogger.warn(`Recording file not found: ${filePath}`);
                return true;
            }
            baseLogger.error('Failed to delete recording:', error);
            throw error;
        }
    }

    async saveThumbnail(imageBuffer, filename) {
        try {
            const filePath = path.join(this.storagePath, 'thumbnails', filename);
            await fs.writeFile(filePath, imageBuffer);
            return path.join('thumbnails', filename);
        } catch (error) {
            baseLogger.error('Failed to save thumbnail:', error);
            throw error;
        }
    }

    async getFileStats(filePath) {
        try {
            const fullPath = path.join(this.storagePath, filePath);
            const stats = await fs.stat(fullPath);
            return {
                size: stats.size,
                created: stats.birthtime,
                modified: stats.mtime
            };
        } catch (error) {
            baseLogger.error('Failed to get file stats:', error);
            throw error;
        }
    }

    async deleteFile(filePath) {
        try {
            const fullPath = path.join(this.storagePath, filePath);
            await fs.unlink(fullPath);
            return true;
        } catch (error) {
            if (error.code === 'ENOENT') {
                return true;
            }
            baseLogger.error('Failed to delete file:', error);
            throw error;
        }
    }

    async createTempFile(prefix = 'temp-') {
        try {
            const filename = `${prefix}${Date.now()}.tmp`;
            const filePath = path.join(this.storagePath, 'temp', filename);
            await fs.writeFile(filePath, '');
            return filePath;
        } catch (error) {
            baseLogger.error('Failed to create temp file:', error);
            throw error;
        }
    }

    async cleanupTempFiles(maxAge = 24 * 60 * 60 * 1000) { // Default: 24 hours
        try {
            const tempDir = path.join(this.storagePath, 'temp');
            const files = await fs.readdir(tempDir);
            const now = Date.now();
            let cleaned = 0;

            for (const file of files) {
                try {
                    const filePath = path.join(tempDir, file);
                    const stats = await fs.stat(filePath);
                    
                    if (now - stats.mtime.getTime() > maxAge) {
                        await fs.unlink(filePath);
                        cleaned++;
                    }
                } catch (error) {
                    baseLogger.warn(`Failed to cleanup temp file ${file}:`, error);
                }
            }

            baseLogger.info(`Cleaned up ${cleaned} temporary files`);
            return cleaned;
        } catch (error) {
            baseLogger.error('Failed to cleanup temp files:', error);
            throw error;
        }
    }
}

module.exports = new StorageService();
