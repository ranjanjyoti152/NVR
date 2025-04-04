const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const baseLogger = require('../utils/baseLogger');

let mongoServer;

async function setupMemoryMongoDB() {
    try {
        baseLogger.info('Setting up in-memory MongoDB...');

        // Close any existing connections
        if (mongoose.connection.readyState !== 0) {
            baseLogger.info('Closing existing MongoDB connection...');
            await mongoose.disconnect();
        }

        // Create new MongoDB instance
        mongoServer = await MongoMemoryServer.create({
            instance: {
                port: 27017,
                dbName: 'nvr_system'
            }
        });

        // Get the connection string
        const mongoUri = await mongoServer.getUri();
        baseLogger.info(`MongoDB Memory Server running at ${mongoUri}`);

        // Configure mongoose
        mongoose.set('strictQuery', false);

        // Connect to the in-memory database
        await mongoose.connect(mongoUri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            dbName: 'nvr_system' // Explicitly set database name
        });

        // Initialize database with default settings
        await initializeDatabase();

        // Setup connection event handlers
        mongoose.connection.on('disconnected', () => {
            baseLogger.warn('Lost connection to MongoDB');
        });

        mongoose.connection.on('reconnected', () => {
            baseLogger.info('Reconnected to MongoDB');
        });

        mongoose.connection.on('error', (error) => {
            baseLogger.error('MongoDB connection error:', error);
        });

        // Handle process termination
        process.on('SIGTERM', async () => {
            await cleanup();
            process.exit(0);
        });

        process.on('SIGINT', async () => {
            await cleanup();
            process.exit(0);
        });

        baseLogger.info('Successfully connected to in-memory MongoDB');
        return true;
    } catch (error) {
        baseLogger.error('Failed to setup in-memory MongoDB:', error);
        throw error;
    }
}

async function initializeDatabase() {
    try {
        // Import the Settings model
        const Settings = require('../models/Settings');

        // Check if default settings exist
        const settingsCount = await Settings.countDocuments();
        if (settingsCount === 0) {
            // Create default settings
            await Settings.create({
                system: {
                    name: 'NVR System',
                    timezone: 'UTC'
                },
                storage: {
                    maxSize: 100,
                    cleanupThreshold: 90,
                    retentionDays: 30,
                    path: process.env.STORAGE_PATH
                },
                recording: {
                    defaultResolution: '720p',
                    defaultFps: '30fps'
                }
            });
            baseLogger.info('Initialized default system settings');
        }
    } catch (error) {
        baseLogger.error('Error initializing database:', error);
        throw error;
    }
}

async function cleanup() {
    try {
        if (mongoose.connection.readyState !== 0) {
            await mongoose.connection.close();
            baseLogger.info('Closed MongoDB connection');
        }
        if (mongoServer) {
            await mongoServer.stop();
            baseLogger.info('Stopped MongoDB Memory Server');
        }
    } catch (error) {
        baseLogger.error('Error during cleanup:', error);
    }
}

// Run setup if called directly
if (require.main === module) {
    setupMemoryMongoDB().catch(error => {
        baseLogger.error('Setup failed:', error);
        process.exit(1);
    });
}

module.exports = setupMemoryMongoDB;
