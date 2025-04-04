const fs = require('fs').promises;
const path = require('path');
const baseLogger = require('../utils/baseLogger');
require('dotenv').config();

async function initializeStorage() {
    const storagePath = process.env.STORAGE_PATH;
    
    // Create required directories
    const directories = [
        'recordings',
        'thumbnails',
        'logs',
        'temp'
    ];

    baseLogger.info('Initializing storage directories...');

    for (const dir of directories) {
        const dirPath = path.join(storagePath, dir);
        try {
            await fs.mkdir(dirPath, { recursive: true });
            baseLogger.info(`Created directory: ${dirPath}`);
        } catch (error) {
            if (error.code !== 'EEXIST') {
                baseLogger.error(`Error creating directory ${dirPath}:`, error);
                throw error;
            } else {
                baseLogger.debug(`Directory already exists: ${dirPath}`);
            }
        }
    }

    // Create .gitkeep files to preserve empty directories
    for (const dir of directories) {
        const gitkeepPath = path.join(storagePath, dir, '.gitkeep');
        try {
            await fs.writeFile(gitkeepPath, '');
            baseLogger.debug(`Created .gitkeep in: ${dir}`);
        } catch (error) {
            baseLogger.warn(`Error creating .gitkeep in ${dir}:`, error);
        }
    }

    baseLogger.info('Storage initialization complete.');
}

async function checkDependencies() {
    baseLogger.info('Checking system dependencies...');

    // Check FFmpeg installation
    try {
        const ffmpeg = require('ffmpeg-static');
        if (!ffmpeg) {
            throw new Error('FFmpeg not found');
        }
        baseLogger.info('FFmpeg found:', ffmpeg);
    } catch (error) {
        baseLogger.error('FFmpeg check failed:', error);
        throw error;
    }

    // Check storage path
    try {
        const stats = await fs.stat(process.env.STORAGE_PATH);
        if (!stats.isDirectory()) {
            throw new Error('Storage path is not a directory');
        }
        baseLogger.info('Storage path verified');
    } catch (error) {
        baseLogger.error('Storage path check failed:', error);
        throw error;
    }

    baseLogger.info('All dependencies checked successfully.');
}

async function validateEnvironment() {
    baseLogger.info('Validating environment...');

    const requiredEnvVars = [
        'PORT',
        'MONGODB_URI',
        'STORAGE_PATH',
        'JWT_SECRET',
        'STREAM_PORT',
        'STREAM_WSPORT'
    ];

    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
        const error = new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
        baseLogger.error(error.message);
        throw error;
    }

    // Validate port numbers
    const ports = ['PORT', 'STREAM_PORT', 'STREAM_WSPORT'].map(p => parseInt(process.env[p]));
    const invalidPorts = ports.some(p => isNaN(p) || p < 1 || p > 65535);
    
    if (invalidPorts) {
        const error = new Error('Invalid port numbers in environment variables');
        baseLogger.error(error.message);
        throw error;
    }

    baseLogger.info('Environment validation complete.');
}

async function init() {
    baseLogger.info('Starting initialization process...');

    try {
        // Validate environment variables
        await validateEnvironment();

        // Initialize storage
        await initializeStorage();

        // Check dependencies
        await checkDependencies();

        baseLogger.info('Initialization complete. Ready to start server.');
    } catch (error) {
        baseLogger.error('Initialization failed:', error);
        throw error;
    }
}

// Run initialization if called directly
if (require.main === module) {
    init().catch(error => {
        baseLogger.error('Initialization failed:', error);
        process.exit(1);
    });
}

module.exports = init;
