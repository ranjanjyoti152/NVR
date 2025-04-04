const Event = require('../models/Event');
const Camera = require('../models/Camera');
const baseLogger = require('../utils/baseLogger');

// Get all events with filtering
exports.getEvents = async (req, res) => {
    try {
        const {
            type,
            source,
            severity,
            status,
            startDate,
            endDate,
            limit = 100,
            page = 1
        } = req.query;

        const query = {};

        // Apply filters
        if (type) query.type = type;
        if (source) query['source.type'] = source;
        if (severity) query.severity = severity;
        if (status) query.status = status;
        if (startDate && endDate) {
            query.createdAt = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        // Calculate pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const events = await Event.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .populate('relatedEvents', 'type severity message createdAt');

        const total = await Event.countDocuments(query);

        res.json({
            success: true,
            count: events.length,
            total,
            page: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit)),
            events
        });
    } catch (error) {
        baseLogger.error('Error getting events:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get events',
            error: error.message
        });
    }
};

// Get single event
exports.getEvent = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id)
            .populate('relatedEvents', 'type severity message createdAt');

        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Event not found'
            });
        }

        res.json({
            success: true,
            event
        });
    } catch (error) {
        baseLogger.error('Error getting event:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get event',
            error: error.message
        });
    }
};

// Create new event
exports.createEvent = async (req, res) => {
    try {
        const event = await Event.create(req.body);

        // If event is related to a camera, update camera status
        if (event.source.type === 'camera' && event.source.id) {
            const camera = await Camera.findById(event.source.id);
            if (camera) {
                switch (event.type) {
                    case 'camera_offline':
                        await camera.updateStatus({ isOnline: false });
                        break;
                    case 'camera_online':
                        await camera.updateStatus({ isOnline: true });
                        break;
                }
            }
        }

        baseLogger.info(`New event created: ${event.type}`);
        res.status(201).json({
            success: true,
            event
        });
    } catch (error) {
        baseLogger.error('Error creating event:', error);
        res.status(400).json({
            success: false,
            message: 'Failed to create event',
            error: error.message
        });
    }
};

// Acknowledge event
exports.acknowledgeEvent = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Event not found'
            });
        }

        await event.acknowledge(req.body.user || 'system');

        baseLogger.info(`Event acknowledged: ${event._id}`);
        res.json({
            success: true,
            event
        });
    } catch (error) {
        baseLogger.error('Error acknowledging event:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to acknowledge event',
            error: error.message
        });
    }
};

// Delete event
exports.deleteEvent = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Event not found'
            });
        }

        // Delete thumbnail if exists
        if (event.thumbnail && event.thumbnail.path) {
            try {
                await fs.unlink(event.thumbnail.path);
            } catch (error) {
                baseLogger.warn(`Failed to delete event thumbnail: ${error.message}`);
            }
        }

        await event.remove();

        baseLogger.info(`Event deleted: ${event._id}`);
        res.json({
            success: true,
            message: 'Event deleted successfully'
        });
    } catch (error) {
        baseLogger.error('Error deleting event:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete event',
            error: error.message
        });
    }
};

// Get event statistics
exports.getEventStats = async (req, res) => {
    try {
        const stats = await Event.getEventStats();
        const criticalEvents = await Event.getCriticalEvents();
        const unacknowledgedCount = await Event.countDocuments({ status: 'new' });

        res.json({
            success: true,
            stats: {
                byStatus: stats,
                criticalCount: criticalEvents.length,
                unacknowledgedCount
            }
        });
    } catch (error) {
        baseLogger.error('Error getting event stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get event statistics',
            error: error.message
        });
    }
};

// Clear events
exports.clearEvents = async (req, res) => {
    try {
        const { status, olderThan, type } = req.body;
        const query = {};

        if (status) query.status = status;
        if (type) query.type = type;
        if (olderThan) {
            query.createdAt = {
                $lt: new Date(olderThan)
            };
        }

        const result = await Event.deleteMany(query);

        baseLogger.info(`Cleared ${result.deletedCount} events`);
        res.json({
            success: true,
            message: `Cleared ${result.deletedCount} events`,
            deletedCount: result.deletedCount
        });
    } catch (error) {
        baseLogger.error('Error clearing events:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to clear events',
            error: error.message
        });
    }
};

// Get camera events
exports.getCameraEvents = async (req, res) => {
    try {
        const { cameraId } = req.params;
        const { limit = 100, page = 1 } = req.query;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const events = await Event.find({
            'source.type': 'camera',
            'source.id': cameraId
        })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Event.countDocuments({
            'source.type': 'camera',
            'source.id': cameraId
        });

        res.json({
            success: true,
            count: events.length,
            total,
            page: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit)),
            events
        });
    } catch (error) {
        baseLogger.error('Error getting camera events:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get camera events',
            error: error.message
        });
    }
};
