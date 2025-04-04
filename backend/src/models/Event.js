const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: [
            'motion_detected',
            'camera_offline',
            'camera_online',
            'recording_started',
            'recording_stopped',
            'recording_failed',
            'storage_warning',
            'system_alert',
            'system_error',
            'security_alert'
        ],
        required: [true, 'Event type is required']
    },
    source: {
        type: {
            type: String,
            enum: ['camera', 'system', 'storage', 'security'],
            required: [true, 'Source type is required']
        },
        id: mongoose.Schema.Types.ObjectId, // Reference to camera or other source
        name: String
    },
    severity: {
        type: String,
        enum: ['info', 'warning', 'error', 'critical'],
        required: [true, 'Severity level is required']
    },
    message: {
        type: String,
        required: [true, 'Event message is required']
    },
    details: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    metadata: {
        ip: String,
        location: String,
        userAgent: String,
        additionalInfo: mongoose.Schema.Types.Mixed
    },
    status: {
        type: String,
        enum: ['new', 'acknowledged', 'resolved', 'ignored'],
        default: 'new'
    },
    acknowledgedBy: {
        user: String,
        timestamp: Date
    },
    resolvedBy: {
        user: String,
        timestamp: Date,
        resolution: String
    },
    notificationSent: {
        type: Boolean,
        default: false
    },
    notificationDetails: {
        channels: [String], // email, push, webhook, etc.
        timestamps: [Date],
        responses: [mongoose.Schema.Types.Mixed]
    },
    relatedEvents: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event'
    }],
    thumbnail: {
        path: String,
        timestamp: Date
    }
}, {
    timestamps: true
});

// Indexes
eventSchema.index({ type: 1, 'source.type': 1 });
eventSchema.index({ severity: 1 });
eventSchema.index({ status: 1 });
eventSchema.index({ createdAt: -1 });
eventSchema.index({ 'source.id': 1, type: 1 });

// Methods
eventSchema.methods.acknowledge = async function(user) {
    this.status = 'acknowledged';
    this.acknowledgedBy = {
        user,
        timestamp: new Date()
    };
    return this.save();
};

eventSchema.methods.resolve = async function(user, resolution) {
    this.status = 'resolved';
    this.resolvedBy = {
        user,
        timestamp: new Date(),
        resolution
    };
    return this.save();
};

eventSchema.methods.ignore = async function() {
    this.status = 'ignored';
    return this.save();
};

eventSchema.methods.addNotification = async function(channel, response) {
    this.notificationSent = true;
    this.notificationDetails.channels.push(channel);
    this.notificationDetails.timestamps.push(new Date());
    this.notificationDetails.responses.push(response);
    return this.save();
};

// Statics
eventSchema.statics.getUnacknowledged = function() {
    return this.find({ status: 'new' })
        .sort({ severity: -1, createdAt: -1 });
};

eventSchema.statics.getBySource = function(sourceType, sourceId) {
    return this.find({
        'source.type': sourceType,
        'source.id': sourceId
    }).sort({ createdAt: -1 });
};

eventSchema.statics.getEventStats = async function() {
    return this.aggregate([
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 },
                bySeverity: {
                    $push: {
                        severity: '$severity',
                        count: 1
                    }
                }
            }
        }
    ]);
};

eventSchema.statics.getCriticalEvents = function() {
    return this.find({
        severity: 'critical',
        status: { $in: ['new', 'acknowledged'] }
    }).sort({ createdAt: -1 });
};

// Pre-save middleware
eventSchema.pre('save', function(next) {
    // Set default severity based on event type if not provided
    if (!this.severity) {
        switch (this.type) {
            case 'motion_detected':
                this.severity = 'info';
                break;
            case 'camera_offline':
                this.severity = 'warning';
                break;
            case 'storage_warning':
                this.severity = 'warning';
                break;
            case 'system_error':
            case 'security_alert':
                this.severity = 'critical';
                break;
            default:
                this.severity = 'info';
        }
    }
    next();
});

const Event = mongoose.model('Event', eventSchema);

module.exports = Event;
