const express = require('express');
const socketio = require('socket.io');
const http = require('http');
const path = require('path');
const cors = require('cors');
const baseLogger = require('./utils/baseLogger');
const streamService = require('./services/streamService');
require('dotenv').config();

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Configure CORS
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? process.env.FRONTEND_URL 
        : '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));

// Initialize Socket.IO
const io = socketio(server, {
    cors: {
        origin: process.env.NODE_ENV === 'production' 
            ? process.env.FRONTEND_URL 
            : '*',
        methods: ['GET', 'POST']
    }
});

// Initialize stream service with server and io
streamService.initialize(server, io);

// Import middleware
const setupSecurity = require('./middleware/security');
const errorHandler = require('./middleware/errorHandler');
const requestLogger = require('./middleware/requestLogger');

// Import routes
const apiRoutes = require('./routes/api');

// Setup security middleware
setupSecurity(app);

// Request logging middleware
app.use(requestLogger);

// Parse JSON bodies
app.use(express.json());

// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(process.env.STORAGE_PATH)));
app.use(express.static(path.join(__dirname, '../public')));

// API Routes
app.use('/api', apiRoutes);

// Serve viewer page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/viewer.html'));
});

// WebSocket connection handling
io.on('connection', (socket) => {
    baseLogger.info('New client connected');

    socket.on('subscribe', (cameraId) => {
        socket.join(`camera_${cameraId}`);
        baseLogger.info(`Client subscribed to camera ${cameraId}`);
    });

    socket.on('unsubscribe', (cameraId) => {
        socket.leave(`camera_${cameraId}`);
        baseLogger.info(`Client unsubscribed from camera ${cameraId}`);
    });

    socket.on('disconnect', () => {
        baseLogger.info('Client disconnected');
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Resource not found'
    });
});

// Error handling middleware
app.use(errorHandler);

// Export for use in other files
module.exports = {
    app,
    server,
    io,
    baseLogger
};
