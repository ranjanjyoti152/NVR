const mongoose = require('mongoose');

const cameraSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Camera name is required'],
        trim: true
    },
    streamUrl: {
        type: String,
        required: [true, 'Stream URL is required'],
        trim: true
    },
    location: {
        type: String,
        trim: true,
        default: 'Unknown'
    },
    resolution: {
        type: String,
        enum: ['1080p', '720p', '480p', '360p'],
        default: '720p'
    },
    fps: {
        type: String,
        enum: ['30fps', '25fps', '20fps', '15fps', '10fps'],
        default: '30fps'
    },
    credentials: {
        username: {
            type: String,
            trim: true
        },
        password: {
            type: String,
            trim: true
        }
    },
    status: {
        isOnline: {
            type: Boolean,
            default: false
        },
        lastSeen: {
            type: Date,
            default: Date.now
        },
        streamActive: {
            type: Boolean,
            default: false
        },
        recording: {
            type: Boolean,
            default: false
        },
        error: {
            type: String,
            default: null
        }
    },
    settings: {
        motionDetection: {
            enabled: {
                type: Boolean,
                default: true
            },
            sensitivity: {
                type: Number,
                min: 1,
                max: 10,
                default: 5
            }
        },
        recordingSchedule: {
            enabled: {
                type: Boolean,
                default: false
            },
            schedule: [{
                day: {
                    type: String,
                    enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
                },
                periods: [{
                    start: String,
                    end: String
                }]
            }]
        }
    }
}, {
    timestamps: true
});

// Add indexes
cameraSchema.index({ name: 1 });
cameraSchema.index({ 'status.isOnline': 1 });
cameraSchema.index({ 'status.streamActive': 1 });
cameraSchema.index({ 'status.recording': 1 });

// Methods
cameraSchema.methods.updateStatus = function(status) {
    this.status = { ...this.status, ...status, lastSeen: Date.now() };
    return this.save();
};

cameraSchema.methods.startStream = function() {
    this.status.streamActive = true;
    this.status.lastSeen = Date.now();
    return this.save();
};

cameraSchema.methods.stopStream = function() {
    this.status.streamActive = false;
    return this.save();
};

cameraSchema.methods.startRecording = function() {
    this.status.recording = true;
    return this.save();
};

cameraSchema.methods.stopRecording = function() {
    this.status.recording = false;
    return this.save();
};

// Statics
cameraSchema.statics.getActiveStreams = function() {
    return this.find({ 'status.streamActive': true });
};

cameraSchema.statics.getRecordingCameras = function() {
    return this.find({ 'status.recording': true });
};

const Camera = mongoose.model('Camera', cameraSchema);

module.exports = Camera;
