const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
    system: {
        name: {
            type: String,
            default: 'NVR System'
        },
        timezone: {
            type: String,
            default: 'UTC'
        },
        version: {
            type: String,
            default: '1.0.0'
        }
    },
    storage: {
        maxSize: {
            type: Number, // in GB
            default: 100
        },
        cleanupThreshold: {
            type: Number, // percentage
            default: 90
        },
        retentionDays: {
            type: Number,
            default: 30
        },
        path: {
            type: String,
            required: [true, 'Storage path is required']
        }
    },
    recording: {
        schedule: {
            enabled: {
                type: Boolean,
                default: false
            },
            globalSchedule: [{
                day: {
                    type: String,
                    enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
                },
                periods: [{
                    start: String,
                    end: String
                }]
            }]
        },
        motionDetection: {
            enabled: {
                type: Boolean,
                default: true
            },
            defaultSensitivity: {
                type: Number,
                min: 1,
                max: 10,
                default: 5
            },
            preRecordSeconds: {
                type: Number,
                default: 10
            },
            postRecordSeconds: {
                type: Number,
                default: 30
            }
        },
        defaultResolution: {
            type: String,
            enum: ['1080p', '720p', '480p', '360p'],
            default: '720p'
        },
        defaultFps: {
            type: String,
            enum: ['30fps', '25fps', '20fps', '15fps', '10fps'],
            default: '30fps'
        }
    },
    notifications: {
        email: {
            enabled: {
                type: Boolean,
                default: false
            },
            smtp: {
                host: String,
                port: Number,
                secure: Boolean,
                auth: {
                    user: String,
                    pass: String
                }
            },
            recipients: [{
                type: String,
                trim: true
            }]
        },
        push: {
            enabled: {
                type: Boolean,
                default: false
            },
            provider: {
                type: String,
                enum: ['firebase', 'webpush'],
                default: 'firebase'
            },
            config: mongoose.Schema.Types.Mixed
        },
        events: {
            motionDetected: {
                enabled: {
                    type: Boolean,
                    default: true
                },
                severity: {
                    type: String,
                    enum: ['info', 'warning', 'error', 'critical'],
                    default: 'info'
                }
            },
            cameraOffline: {
                enabled: {
                    type: Boolean,
                    default: true
                },
                severity: {
                    type: String,
                    enum: ['info', 'warning', 'error', 'critical'],
                    default: 'warning'
                }
            },
            storageWarning: {
                enabled: {
                    type: Boolean,
                    default: true
                },
                severity: {
                    type: String,
                    enum: ['info', 'warning', 'error', 'critical'],
                    default: 'warning'
                },
                threshold: {
                    type: Number,
                    default: 90
                }
            },
            systemAlert: {
                enabled: {
                    type: Boolean,
                    default: true
                },
                severity: {
                    type: String,
                    enum: ['info', 'warning', 'error', 'critical'],
                    default: 'critical'  // Changed from 'danger' to 'critical'
                }
            }
        }
    },
    maintenance: {
        autoUpdate: {
            enabled: {
                type: Boolean,
                default: false
            },
            schedule: {
                type: String,
                default: '0 0 * * 0' // Every Sunday at midnight
            }
        },
        cleanup: {
            enabled: {
                type: Boolean,
                default: true
            },
            schedule: {
                type: String,
                default: '0 1 * * *' // Every day at 1 AM
            }
        },
        backup: {
            enabled: {
                type: Boolean,
                default: false
            },
            schedule: {
                type: String,
                default: '0 2 * * 0' // Every Sunday at 2 AM
            },
            retention: {
                type: Number,
                default: 7 // Keep backups for 7 days
            }
        }
    }
}, {
    timestamps: true
});

// Methods
settingsSchema.methods.updateSection = async function(section, data) {
    this[section] = { ...this[section], ...data };
    return this.save();
};

// Statics
settingsSchema.statics.getSettings = async function() {
    const settings = await this.findOne();
    if (!settings) {
        return this.create({
            storage: {
                path: process.env.STORAGE_PATH
            }
        });
    }
    return settings;
};

// Ensure only one settings document exists
settingsSchema.statics.initialize = async function() {
    const count = await this.countDocuments();
    if (count === 0) {
        await this.create({
            storage: {
                path: process.env.STORAGE_PATH
            }
        });
    }
};

const Settings = mongoose.model('Settings', settingsSchema);

module.exports = Settings;
