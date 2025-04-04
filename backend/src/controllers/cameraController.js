const Camera = require('../models/Camera');
const streamService = require('../services/streamService');
const baseLogger = require('../utils/baseLogger');

// Get all cameras
exports.getCameras = async (req, res) => {
    try {
        const cameras = await Camera.find();
        res.json({
            success: true,
            count: cameras.length,
            cameras
        });
    } catch (error) {
        baseLogger.error('Error getting cameras:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get cameras',
            error: error.message
        });
    }
};

// Get single camera
exports.getCamera = async (req, res) => {
    try {
        const camera = await Camera.findById(req.params.id);
        if (!camera) {
            return res.status(404).json({
                success: false,
                message: 'Camera not found'
            });
        }
        res.json({
            success: true,
            camera
        });
    } catch (error) {
        baseLogger.error('Error getting camera:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get camera',
            error: error.message
        });
    }
};

// Add new camera
exports.addCamera = async (req, res) => {
    try {
        const camera = await Camera.create(req.body);
        baseLogger.info(`New camera added: ${camera.name}`);
        res.status(201).json({
            success: true,
            camera
        });
    } catch (error) {
        baseLogger.error('Error adding camera:', error);
        res.status(400).json({
            success: false,
            message: 'Failed to add camera',
            error: error.message
        });
    }
};

// Update camera
exports.updateCamera = async (req, res) => {
    try {
        const camera = await Camera.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!camera) {
            return res.status(404).json({
                success: false,
                message: 'Camera not found'
            });
        }
        baseLogger.info(`Camera updated: ${camera.name}`);
        res.json({
            success: true,
            camera
        });
    } catch (error) {
        baseLogger.error('Error updating camera:', error);
        res.status(400).json({
            success: false,
            message: 'Failed to update camera',
            error: error.message
        });
    }
};

// Delete camera
exports.deleteCamera = async (req, res) => {
    try {
        const camera = await Camera.findById(req.params.id);
        if (!camera) {
            return res.status(404).json({
                success: false,
                message: 'Camera not found'
            });
        }

        // Stop stream if active
        if (camera.status.streamActive) {
            await streamService.stopStream(camera.id);
        }

        await camera.remove();
        baseLogger.info(`Camera deleted: ${camera.name}`);
        res.json({
            success: true,
            message: 'Camera deleted successfully'
        });
    } catch (error) {
        baseLogger.error('Error deleting camera:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete camera',
            error: error.message
        });
    }
};

// Start camera stream
exports.startStream = async (req, res) => {
    try {
        const camera = await Camera.findById(req.params.id);
        if (!camera) {
            return res.status(404).json({
                success: false,
                message: 'Camera not found'
            });
        }

        if (camera.status.streamActive) {
            return res.status(400).json({
                success: false,
                message: 'Stream is already active'
            });
        }

        await streamService.startStream(camera);
        await camera.startStream();

        baseLogger.info(`Stream started for camera: ${camera.name}`);
        res.json({
            success: true,
            message: 'Stream started successfully',
            camera
        });
    } catch (error) {
        baseLogger.error('Error starting stream:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to start stream',
            error: error.message
        });
    }
};

// Stop camera stream
exports.stopStream = async (req, res) => {
    try {
        const camera = await Camera.findById(req.params.id);
        if (!camera) {
            return res.status(404).json({
                success: false,
                message: 'Camera not found'
            });
        }

        if (!camera.status.streamActive) {
            return res.status(400).json({
                success: false,
                message: 'Stream is not active'
            });
        }

        await streamService.stopStream(camera.id);
        await camera.stopStream();

        baseLogger.info(`Stream stopped for camera: ${camera.name}`);
        res.json({
            success: true,
            message: 'Stream stopped successfully',
            camera
        });
    } catch (error) {
        baseLogger.error('Error stopping stream:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to stop stream',
            error: error.message
        });
    }
};

// Get camera status
exports.getCameraStatus = async (req, res) => {
    try {
        const camera = await Camera.findById(req.params.id);
        if (!camera) {
            return res.status(404).json({
                success: false,
                message: 'Camera not found'
            });
        }

        // Get stream status if active
        let streamStatus = null;
        if (camera.status.streamActive) {
            streamStatus = await streamService.getStreamStatus(camera.id);
        }

        res.json({
            success: true,
            status: {
                ...camera.status.toObject(),
                stream: streamStatus
            }
        });
    } catch (error) {
        baseLogger.error('Error getting camera status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get camera status',
            error: error.message
        });
    }
};

// Retry camera connection
exports.retryCamera = async (req, res) => {
    try {
        const camera = await Camera.findById(req.params.id);
        if (!camera) {
            return res.status(404).json({
                success: false,
                message: 'Camera not found'
            });
        }

        // Stop existing stream if active
        if (camera.status.streamActive) {
            await streamService.stopStream(camera.id);
            await camera.stopStream();
        }

        // Try to start stream again
        await streamService.startStream(camera);
        await camera.startStream();

        baseLogger.info(`Camera connection retried: ${camera.name}`);
        res.json({
            success: true,
            message: 'Camera connection retried successfully',
            camera
        });
    } catch (error) {
        baseLogger.error('Error retrying camera connection:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retry camera connection',
            error: error.message
        });
    }
};
