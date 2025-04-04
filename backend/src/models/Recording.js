const mongoose = require('mongoose');

const recordingSchema = new mongoose.Schema({
    camera: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Camera',
        required: [true, 'Camera reference is required']
    },
    startTime: {
        type: Date,
        required: [true, 'Start time is required'],
        default: Date.now
    },
    endTime: {
        type: Date,
        default: null
    },
    duration: {
        type: Number, // in seconds
        default: 0
    },
    status: {
        type: String,
        enum: ['recording', 'completed', 'failed', 'processing'],
        default: 'recording'
    },
    type: {
        type: String,
        enum: ['continuous', 'motion', 'manual', 'scheduled'],
        required: [true, 'Recording type is required']
    },
    filePath: {
        type: String,
        required: [true, 'File path is required']
    },
    fileSize: {
        type: Number, // in bytes
        default: 0
    },
    thumbnailPath: {
        type: String
    },
    resolution: {
        type: String,
        enum: ['1080p', '720p', '480p', '360p'],
        required: [true, 'Resolution is required']
    },
    fps: {
        type: String,
        enum: ['30fps', '25fps', '20fps', '15fps', '10fps'],
        required: [true, 'FPS is required']
    },
    metadata: {
        format: String,
        codec: String,
        bitrate: Number,
        hasAudio: {
            type: Boolean,
            default: false
        }
    },
    events: [{
        type: {
            type: String,
            enum: ['motion', 'object_detected', 'face_detected', 'error'],
            required: true
        },
        timestamp: {
            type: Date,
            required: true
        },
        details: mongoose.Schema.Types.Mixed
    }],
    error: {
        message: String,
        code: String,
        timestamp: Date
    }
}, {
    timestamps: true
});

// Indexes
recordingSchema.index({ camera: 1, startTime: -1 });
recordingSchema.index({ status: 1 });
recordingSchema.index({ type: 1 });
recordingSchema.index({ 'events.type': 1 });

// Virtual for recording URL
recordingSchema.virtual('url').get(function() {
    return `/recordings/${this._id}`;
});

// Methods
recordingSchema.methods.complete = async function(endTime = new Date()) {
    this.endTime = endTime;
    this.status = 'completed';
    this.duration = Math.round((this.endTime - this.startTime) / 1000);
    return this.save();
};

recordingSchema.methods.fail = async function(error) {
    this.status = 'failed';
    this.error = {
        message: error.message,
        code: error.code,
        timestamp: new Date()
    };
    return this.save();
};

recordingSchema.methods.addEvent = async function(event) {
    this.events.push({
        ...event,
        timestamp: event.timestamp || new Date()
    });
    return this.save();
};

// Statics
recordingSchema.statics.getActiveRecordings = function() {
    return this.find({ status: 'recording' }).populate('camera');
};

recordingSchema.statics.getRecordingsByCamera = function(cameraId, options = {}) {
    const query = { camera: cameraId };
    
    if (options.status) {
        query.status = options.status;
    }
    
    if (options.startDate && options.endDate) {
        query.startTime = {
            $gte: options.startDate,
            $lte: options.endDate
        };
    }

    return this.find(query)
        .sort({ startTime: -1 })
        .limit(options.limit || 100);
};

recordingSchema.statics.getStorageStats = async function() {
    const stats = await this.aggregate([
        {
            $group: {
                _id: null,
                totalSize: { $sum: '$fileSize' },
                totalDuration: { $sum: '$duration' },
                count: { $sum: 1 }
            }
        }
    ]);

    return stats[0] || { totalSize: 0, totalDuration: 0, count: 0 };
};

// Pre-save middleware
recordingSchema.pre('save', function(next) {
    if (this.isModified('endTime') && this.endTime) {
        this.duration = Math.round((this.endTime - this.startTime) / 1000);
    }
    next();
});

const Recording = mongoose.model('Recording', recordingSchema);

module.exports = Recording;
