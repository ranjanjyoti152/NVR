const { server, baseLogger } = require('./app');
const { systemMonitor } = require('./utils/systemMonitor');
const storageService = require('./services/storageService');
const setupMemoryMongoDB = require('./scripts/setupMongoDB');
const init = require('./scripts/init');

const PORT = process.env.PORT || 5000;

async function startServer() {
    try {
        // Run initialization checks
        await init();

        // Setup MongoDB
        await setupMemoryMongoDB();

        // Initialize storage service
        await storageService.initialize();

        // Initialize system monitoring
        await systemMonitor.start();
        baseLogger.info('System monitoring started');

        // Start the server
        server.listen(PORT, () => {
            baseLogger.info(`Server running on port ${PORT}`);
            baseLogger.info(`Environment: ${process.env.NODE_ENV}`);
            baseLogger.info('Server initialization complete');

            // Log startup summary
            const summary = {
                environment: process.env.NODE_ENV,
                port: PORT,
                storage: process.env.STORAGE_PATH,
                streamPort: process.env.STREAM_PORT,
                streamWsPort: process.env.STREAM_WSPORT
            };
            baseLogger.info('Server configuration:', summary);
        });

        // Handle process termination
        const cleanup = async (signal) => {
            baseLogger.info(`${signal} received. Starting graceful shutdown...`);

            // Stop accepting new connections
            server.close(async () => {
                baseLogger.info('HTTP server closed');

                try {
                    // Cleanup tasks
                    await storageService.cleanupTempFiles();
                    baseLogger.info('Storage service cleaned up');

                    // Stop system monitor
                    systemMonitor.stop();
                    baseLogger.info('System monitor stopped');

                    baseLogger.info('Graceful shutdown completed');
                    process.exit(0);
                } catch (error) {
                    baseLogger.error('Error during shutdown:', error);
                    process.exit(1);
                }
            });

            // Force shutdown after timeout
            setTimeout(() => {
                baseLogger.error('Forced shutdown due to timeout');
                process.exit(1);
            }, 30000); // 30 seconds timeout
        };

        // Register shutdown handlers
        process.on('SIGTERM', () => cleanup('SIGTERM'));
        process.on('SIGINT', () => cleanup('SIGINT'));

    } catch (error) {
        baseLogger.error('Failed to start server:', error);
        process.exit(1);
    }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    baseLogger.error('Uncaught Exception:', error);
    process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (error) => {
    baseLogger.error('Unhandled Rejection:', error);
    process.exit(1);
});

// Start the server
if (require.main === module) {
    startServer().catch((error) => {
        baseLogger.error('Server startup failed:', error);
        process.exit(1);
    });
}

module.exports = { startServer };
