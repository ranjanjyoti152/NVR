const logger = require('../utils/logger');

const requestLogger = (req, res, next) => {
    // Get start time
    const start = Date.now();

    // Log request
    logger.debug({
        type: 'request_start',
        method: req.method,
        url: req.url,
        ip: req.ip,
        timestamp: new Date().toISOString()
    });

    // Process request
    res.on('finish', () => {
        // Calculate duration
        const duration = Date.now() - start;

        // Log response
        logger.logAPIRequest(req, res, duration);

        // Log detailed debug information if needed
        if (process.env.LOG_LEVEL === 'debug') {
            logger.debug({
                type: 'request_details',
                method: req.method,
                url: req.url,
                body: req.body,
                query: req.query,
                params: req.params,
                headers: req.headers,
                status: res.statusCode,
                duration,
                timestamp: new Date().toISOString()
            });
        }

        // Log slow requests
        if (duration > 1000) {
            logger.warn({
                type: 'slow_request',
                method: req.method,
                url: req.url,
                duration,
                timestamp: new Date().toISOString()
            });
        }
    });

    next();
};

module.exports = requestLogger;
