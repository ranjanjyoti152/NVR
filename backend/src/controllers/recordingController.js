const Recording = require('../models/Recording');
const Camera = require('../models/Camera');
const streamService = require('../services/streamService');
const storageService = require('../services/storageService');
const baseLogger = require('../utils/baseLogger');
const path = require('path');

// Get all recordings
exports.getRecordings = async (req, res) => {
    try {
        const { camera, status, startDate, endDate, limit = 100 } = req.query;
        const query = {};

        if (camera) query.camera = camera;
        if (status) query.status = status;
        if (startDate && endDate) {
            query.startTime = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        const recordings = await Recording.find(query)
            .populate('camera', 'name location')
            .sort({ startTime: -1 })
            .limit(parseInt(limit));

        res.json({
            success: true,
            count: recordings.length,
            recordings
        });
    } catch (error) {
        baseLogger.error('Error getting recordings:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get recordings',
            error: error.message
        });
    }
};

// Get single recording
exports.getRecording = async (req, res) => {
    try {
        const recording = await Recording.findById(req.params.id)
            .populate('camera', 'name location');

        if (!recording) {
            return res.status(404).json({
                success: false,
                message: 'Recording not found'
            });
        }

        res.json({
            success: true,
            recording
        });
    } catch (error) {
        baseLogger.error('Error getting recording:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get recording',
            error: error.message
        });
    }
};

// Start recording
exports.startRecording = async (req, res) => {
    try {
        const { cameraId, type = 'manual' } = req.body;

        // Check if camera exists
        const camera = await Camera.findById(cameraId);
        if (!camera) {
            return res.status(404).json({
                success: false,
                message: 'Camera not found'
            });
        }

        // Check if camera is streaming
        if (!camera.status.streamActive) {
            return res.status(400).json({
                success: false,
                message: 'Camera stream must be active to start recording'
            });
        }

        // Generate file path
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const fileName = `${camera.name}_${timestamp}.mp4`;
        const filePath = path.join('recordings', fileName);

        // Create recording document
        const recording = await Recording.create({
            camera: camera._id,
            type,
            filePath,
            resolution: camera.resolution,
            fps: camera.fps
        });

        // Update camera status
        await camera.startRecording();

        // Start recording stream
        await streamService.startRecording(camera.id, recording.id, filePath);

        baseLogger.info(`Started recording for camera: ${camera.name}`);
        res.status(201).json({
            success: true,
            recording
        });
    } catch (error) {
        baseLogger.error('Error starting recording:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to start recording',
            error: error.message
        });
    }
};

// Stop recording
exports.stopRecording = async (req, res) => {
    try {
        const recording = await Recording.findById(req.params.id);
        if (!recording) {
            return res.status(404).json({
                success: false,
                message: 'Recording not found'
            });
        }

        if (recording.status !== 'recording') {
            return res.status(400).json({
                success: false,
                message: 'Recording is not active'
            });
        }

        // Stop the recording stream
        await streamService.stopRecording(recording.camera);

        // Update recording status
        const endTime = new Date();
        await recording.complete(endTime);

        // Update camera status
        const camera = await Camera.findById(recording.camera);
        if (camera) {
            await camera.stopRecording();
        }

        // Get file size
        const stats = await storageService.getFileStats(recording.filePath);
        recording.fileSize = stats.size;
        await recording.save();

        baseLogger.info(`Stopped recording: ${recording._id}`);
        res.json({
            success: true,
            recording
        });
    } catch (error) {
        baseLogger.error('Error stopping recording:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to stop recording',
            error: error.message
        });
    }
};

// Delete recording
exports.deleteRecording = async (req, res) => {
    try {
        const recording = await Recording.findById(req.params.id);
        if (!recording) {
            return res.status(404).json({
                success: false,
                message: 'Recording not found'
            });
        }

        // If recording is active, stop it first
        if (recording.status === 'recording') {
            await streamService.stopRecording(recording.camera);
            const camera = await Camera.findById(recording.camera);
            if (camera) {
                await camera.stopRecording();
            }
        }

        // Delete recording file
        await storageService.deleteRecording(recording.filePath);

        // Delete thumbnail if exists
        if (recording.thumbnailPath) {
            await storageService.deleteFile(recording.thumbnailPath);
        }

        // Delete recording document
        await recording.remove();

        baseLogger.info(`Deleted recording: ${recording._id}`);
        res.json({
            success: true,
            message: 'Recording deleted successfully'
        });
    } catch (error) {
        baseLogger.error('Error deleting recording:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete recording',
            error: error.message
        });
    }
};

// Get storage statistics
exports.getStorageStats = async (req, res) => {
    try {
        const stats = await Recording.getStorageStats();
        const storageInfo = await storageService.getStorageInfo();

        res.json({
            success: true,
            stats: {
                recordings: {
                    count: stats.count,
                    totalSize: stats.totalSize,
                    totalDuration: stats.totalDuration
                },
                storage: storageInfo
            }
        });
    } catch (error) {
        baseLogger.error('Error getting storage stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get storage statistics',
            error: error.message
        });
    }
};

// Add event to recording
exports.addEvent = async (req, res) => {
    try {
        const recording = await Recording.findById(req.params.id);
        if (!recording) {
            return res.status(404).json({
                success: false,
                message: 'Recording not found'
            });
        }

        const event = {
            type: req.body.type,
            timestamp: req.body.timestamp || new Date(),
            details: req.body.details
        };

        await recording.addEvent(event);

        baseLogger.info(`Added event to recording: ${recording._id}`);
        res.json({
            success: true,
            recording
        });
    } catch (error) {
        baseLogger.error('Error adding event to recording:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add event to recording',
            error: error.message
        });
    }
};

// Get recording events
exports.getRecordingEvents = async (req, res) => {
    try {
        const recording = await Recording.findById(req.params.id);
        if (!recording) {
            return res.status(404).json({
                success: false,
                message: 'Recording not found'
            });
        }

        res.json({
            success: true,
            events: recording.events
        });
    } catch (error) {
        baseLogger.error('Error getting recording events:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get recording events',
            error: error.message
        });
    }
};
