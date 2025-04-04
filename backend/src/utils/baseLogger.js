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

// Create the base logger
const baseLogger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    levels,
    transports: [
        new winston.transports.Console({
            format: consoleFormat
        })
    ]
});

module.exports = baseLogger;
