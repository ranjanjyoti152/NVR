const express = require('express');
const router = express.Router();
const baseLogger = require('../utils/baseLogger');

const cameraController = require('../controllers/cameraController');
const recordingController = require('../controllers/recordingController');
const systemController = require('../controllers/systemController');
const eventController = require('../controllers/eventController');

// Test route
router.get('/test', (req, res) => {
    baseLogger.info('Test route accessed');
    res.json({
        success: true,
        message: 'NVR API is running',
        timestamp: new Date().toISOString()
    });
});

// Camera routes
router.get('/cameras', cameraController.getCameras);
router.get('/cameras/:id', cameraController.getCamera);
router.post('/cameras', cameraController.addCamera);
router.put('/cameras/:id', cameraController.updateCamera);
router.delete('/cameras/:id', cameraController.deleteCamera);
router.post('/cameras/:id/retry', cameraController.retryCamera);
router.get('/cameras/:id/status', cameraController.getCameraStatus);

// Camera stream routes
router.post('/cameras/:id/stream/start', cameraController.startStream);
router.post('/cameras/:id/stream/stop', cameraController.stopStream);

// Recording routes
router.get('/recordings', recordingController.getRecordings);
router.get('/recordings/:id', recordingController.getRecording);
router.post('/recordings', recordingController.startRecording);
router.put('/recordings/:id/stop', recordingController.stopRecording);
router.delete('/recordings/:id', recordingController.deleteRecording);
router.get('/recordings/storage/stats', recordingController.getStorageStats);
router.post('/recordings/:id/events', recordingController.addEvent);
router.get('/recordings/:id/events', recordingController.getRecordingEvents);

// System routes
router.get('/system/status', systemController.getSystemStatus);
router.get('/system/settings', systemController.getSettings);
router.put('/system/settings', systemController.updateSettings);
router.get('/system/performance', systemController.getPerformanceMetrics);
router.get('/system/storage', systemController.getStorageStatus);
router.post('/system/maintenance', systemController.performMaintenance);
router.get('/system/logs', systemController.getSystemLogs);
router.post('/system/notifications/test', systemController.testNotification);

// Event routes
router.get('/events', eventController.getEvents);
router.get('/events/:id', eventController.getEvent);
router.post('/events', eventController.createEvent);
router.put('/events/:id/acknowledge', eventController.acknowledgeEvent);
router.delete('/events/:id', eventController.deleteEvent);
router.get('/events/stats', eventController.getEventStats);
router.post('/events/clear', eventController.clearEvents);
router.get('/cameras/:cameraId/events', eventController.getCameraEvents);

// Error handling for routes
router.use((err, req, res, next) => {
    baseLogger.error('API Error:', err);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

module.exports = router;
