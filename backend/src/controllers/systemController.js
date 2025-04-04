const Settings = require('../models/Settings');
const Camera = require('../models/Camera');
const Recording = require('../models/Recording');
const Event = require('../models/Event');
const systemMonitor = require('../utils/systemMonitor');
const storageService = require('../services/storageService');
const baseLogger = require('../utils/baseLogger');
const path = require('path');
const fs = require('fs').promises;

// Get system status
exports.getSystemStatus = async (req, res) => {
    try {
        // Get system metrics
        const metrics = await systemMonitor.getMetrics();
        
        // Get storage info
        const storage = await storageService.getStorageInfo();

        // Get camera status
        const cameras = await Camera.find();
        const activeCameras = cameras.filter(c => c.status.isOnline).length;

        // Get unacknowledged events
        const unacknowledgedEvents = await Event.countDocuments({ status: 'new' });

        // Get settings
        const settings = await Settings.getSettings();

        res.json({
            success: true,
            system: {
                ...metrics,
                name: settings.system.name,
                timezone: settings.system.timezone
            },
            storage,
            cameras: {
                total: cameras.length,
                active: activeCameras,
                recording: cameras.filter(c => c.status.recording).length
            },
            events: {
                unacknowledged: unacknowledgedEvents
            },
            lastUpdate: new Date()
        });
    } catch (error) {
        baseLogger.error('Error getting system status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get system status',
            error: error.message
        });
    }
};

// Get system settings
exports.getSettings = async (req, res) => {
    try {
        const settings = await Settings.getSettings();
        res.json({
            success: true,
            settings
        });
    } catch (error) {
        baseLogger.error('Error getting settings:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get settings',
            error: error.message
        });
    }
};

// Update system settings
exports.updateSettings = async (req, res) => {
    try {
        const settings = await Settings.findOne();
        if (!settings) {
            return res.status(404).json({
                success: false,
                message: 'Settings not found'
            });
        }

        // Update each section if provided
        const sections = ['system', 'storage', 'recording', 'notifications', 'maintenance'];
        for (const section of sections) {
            if (req.body[section]) {
                await settings.updateSection(section, req.body[section]);
            }
        }

        baseLogger.info('System settings updated');
        res.json({
            success: true,
            settings
        });
    } catch (error) {
        baseLogger.error('Error updating settings:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update settings',
            error: error.message
        });
    }
};

// Get system performance metrics
exports.getPerformanceMetrics = async (req, res) => {
    try {
        const metrics = await systemMonitor.getMetrics();
        res.json({
            success: true,
            metrics
        });
    } catch (error) {
        baseLogger.error('Error getting performance metrics:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get performance metrics',
            error: error.message
        });
    }
};

// Get storage status
exports.getStorageStatus = async (req, res) => {
    try {
        // Get storage info
        const storage = await storageService.getStorageInfo();

        // Get recordings stats
        const recordingStats = await Recording.getStorageStats();

        res.json({
            success: true,
            storage: {
                ...storage,
                recordings: {
                    count: recordingStats.count,
                    totalSize: recordingStats.totalSize,
                    totalDuration: recordingStats.totalDuration
                }
            }
        });
    } catch (error) {
        baseLogger.error('Error getting storage status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get storage status',
            error: error.message
        });
    }
};

// Perform system maintenance
exports.performMaintenance = async (req, res) => {
    try {
        const tasks = req.body.tasks || ['cleanup'];
        const results = {};

        for (const task of tasks) {
            switch (task) {
                case 'cleanup':
                    results.cleanup = await storageService.performCleanup();
                    break;
                case 'checkCameras':
                    results.cameras = await checkAllCameras();
                    break;
                case 'updateThumbnails':
                    results.thumbnails = await updateRecordingThumbnails();
                    break;
                default:
                    results[task] = { status: 'skipped', message: 'Unknown task' };
            }
        }

        baseLogger.info('System maintenance completed');
        res.json({
            success: true,
            results
        });
    } catch (error) {
        baseLogger.error('Error performing maintenance:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to perform maintenance',
            error: error.message
        });
    }
};

// Get system logs
exports.getSystemLogs = async (req, res) => {
    try {
        const { level = 'info', limit = 100, startDate, endDate } = req.query;
        const logPath = path.join(process.env.STORAGE_PATH, 'logs', 'system.log');

        // Read log file
        const logContent = await fs.readFile(logPath, 'utf8');
        const logLines = logContent.split('\n').filter(Boolean);

        // Filter and parse logs
        const logs = logLines
            .map(line => {
                try {
                    return JSON.parse(line);
                } catch {
                    return null;
                }
            })
            .filter(log => {
                if (!log) return false;
                if (level && log.level !== level) return false;
                if (startDate && new Date(log.timestamp) < new Date(startDate)) return false;
                if (endDate && new Date(log.timestamp) > new Date(endDate)) return false;
                return true;
            })
            .slice(-limit);

        res.json({
            success: true,
            count: logs.length,
            logs
        });
    } catch (error) {
        baseLogger.error('Error getting system logs:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get system logs',
            error: error.message
        });
    }
};

// Test notification
exports.testNotification = async (req, res) => {
    try {
        const { type = 'email' } = req.body;
        const settings = await Settings.getSettings();

        if (!settings.notifications[type].enabled) {
            return res.status(400).json({
                success: false,
                message: `${type} notifications are not enabled`
            });
        }

        // Create test event
        const event = await Event.create({
            type: 'system_alert',
            source: {
                type: 'system',
                name: 'System Test'
            },
            severity: 'info',
            message: 'This is a test notification',
            details: {
                test: true,
                timestamp: new Date()
            }
        });

        // TODO: Implement actual notification sending logic
        baseLogger.info(`Test notification sent via ${type}`);
        res.json({
            success: true,
            message: `Test notification sent via ${type}`,
            event
        });
    } catch (error) {
        baseLogger.error('Error sending test notification:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send test notification',
            error: error.message
        });
    }
};

// Helper functions
async function checkAllCameras() {
    const cameras = await Camera.find();
    const results = [];

    for (const camera of cameras) {
        try {
            // Attempt to connect to camera
            const isOnline = await checkCameraConnection(camera);
            
            // Update camera status
            await camera.updateStatus({
                isOnline,
                error: isOnline ? null : 'Failed to connect to camera'
            });

            results.push({
                id: camera._id,
                name: camera.name,
                status: isOnline ? 'online' : 'offline'
            });
        } catch (error) {
            results.push({
                id: camera._id,
                name: camera.name,
                status: 'error',
                error: error.message
            });
        }
    }

    return results;
}

async function checkCameraConnection(camera) {
    // TODO: Implement actual camera connection check
    return true;
}

async function updateRecordingThumbnails() {
    const recordings = await Recording.find({
        thumbnailPath: { $exists: false }
    });

    const results = [];
    for (const recording of recordings) {
        try {
            const thumbnail = await generateThumbnail(recording);
            recording.thumbnailPath = thumbnail;
            await recording.save();

            results.push({
                id: recording._id,
                status: 'success'
            });
        } catch (error) {
            results.push({
                id: recording._id,
                status: 'error',
                error: error.message
            });
        }
    }

    return results;
}

async function generateThumbnail(recording) {
    // TODO: Implement actual thumbnail generation
    return `thumbnails/${recording._id}.jpg`;
}
