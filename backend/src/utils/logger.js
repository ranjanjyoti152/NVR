const winston = require('winston');
const path = require('path');

// Define custom log levels and colors
const levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4
};

const colors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'blue'
};

// Add colors to Winston
winston.addColors(colors);

// Create format for console output
const consoleFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.colorize({ all: true }),
    winston.format.printf(
        (info) => `${info.timestamp} ${info.level}: ${info.message}`
    )
);

// Create format for file output
const fileFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.json()
);

// Create the logger
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    levels,
    transports: [
        // Write all logs with level 'error' and below to error.log
        new winston.transports.File({
            filename: path.join(process.env.STORAGE_PATH, 'logs', 'error.log'),
            level: 'error',
            format: fileFormat,
            maxsize: 5242880, // 5MB
            maxFiles: 5
        }),
        // Write all logs with level 'info' and below to combined.log
        new winston.transports.File({
            filename: path.join(process.env.STORAGE_PATH, 'logs', 'combined.log'),
            format: fileFormat,
            maxsize: 5242880, // 5MB
            maxFiles: 5
        })
    ]
});

// If we're not in production, log to the console as well
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: consoleFormat
    }));
}

// Create a stream object for Morgan middleware
logger.stream = {
    write: (message) => logger.http(message.trim())
};

// Helper functions for structured logging
logger.logSystemEvent = (type, message, details = {}) => {
    logger.info({
        type,
        message,
        details,
        timestamp: new Date().toISOString()
    });
};

logger.logCameraEvent = (cameraId, type, message, details = {}) => {
    logger.info({
        cameraId,
        type,
        message,
        details,
        timestamp: new Date().toISOString()
    });
};

logger.logStorageEvent = (operation, details = {}) => {
    logger.info({
        type: 'storage',
        operation,
        details,
        timestamp: new Date().toISOString()
    });
};

logger.logSecurityEvent = (action, details = {}) => {
    logger.warn({
        type: 'security',
        action,
        details,
        timestamp: new Date().toISOString()
    });
};

// Error logging with stack traces
logger.logError = (error, context = {}) => {
    logger.error({
        message: error.message,
        stack: error.stack,
        context,
        timestamp: new Date().toISOString()
    });
};

// Performance logging
logger.logPerformance = (operation, duration, details = {}) => {
    logger.debug({
        type: 'performance',
        operation,
        duration,
        details,
        timestamp: new Date().toISOString()
    });
};

// API request logging
logger.logAPIRequest = (req, res, duration) => {
    logger.http({
        type: 'api_request',
        method: req.method,
        url: req.url,
        status: res.statusCode,
        duration,
        ip: req.ip,
        timestamp: new Date().toISOString()
    });
};

// Create directory for logs if it doesn't exist
const fs = require('fs');
const logDir = path.join(process.env.STORAGE_PATH, 'logs');
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}

module.exports = logger;
