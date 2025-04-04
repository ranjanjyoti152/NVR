# NVR System Backend

Backend server for the Network Video Recorder (NVR) system, providing API endpoints for camera management, video recording, and system monitoring.

## Features

- Camera management and live streaming
- Video recording and playback
- System monitoring and statistics
- Event logging and notifications
- Storage management
- Real-time updates via WebSocket

## Prerequisites

- Node.js >= 14.0.0
- MongoDB >= 4.4
- FFmpeg
- Sufficient storage space for recordings

## Installation

1. Clone the repository and navigate to the backend directory:
```bash
cd NVR/backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file with the following configuration:
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/nvr_system

# Storage Configuration
STORAGE_PATH=/path/to/storage
MAX_STORAGE_GB=100

# JWT Configuration
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=24h

# RTSP Stream Configuration
STREAM_PORT=8554
STREAM_WSPORT=9000

# Logging Configuration
LOG_LEVEL=debug
```

4. Initialize the system:
```bash
node src/scripts/init.js
```

5. Start the server:
```bash
# Development
npm run dev

# Production
npm start
```

## API Endpoints

### Camera Management

- `GET /api/cameras` - List all cameras
- `GET /api/cameras/:id` - Get camera details
- `POST /api/cameras` - Add new camera
- `PUT /api/cameras/:id` - Update camera
- `DELETE /api/cameras/:id` - Delete camera
- `POST /api/cameras/:id/retry` - Retry camera connection
- `GET /api/cameras/:id/status` - Get camera status

### Recording Management

- `GET /api/recordings` - List recordings
- `GET /api/recordings/:id` - Get recording details
- `POST /api/recordings` - Start recording
- `PUT /api/recordings/:id/stop` - Stop recording
- `DELETE /api/recordings/:id` - Delete recording
- `GET /api/recordings/storage/stats` - Get storage statistics
- `POST /api/recordings/:id/events` - Add event to recording
- `GET /api/recordings/:id/events` - Get recording events

### System Management

- `GET /api/system-status` - Get system status
- `GET /api/settings` - Get system settings
- `PUT /api/settings` - Update system settings
- `GET /api/performance` - Get performance metrics
- `GET /api/storage` - Get storage status
- `POST /api/maintenance` - Perform system maintenance
- `GET /api/logs` - Get system logs
- `POST /api/notifications/test` - Test notification settings

### Event Management

- `GET /api/events` - List events
- `GET /api/events/:id` - Get event details
- `POST /api/events` - Create new event
- `PUT /api/events/:id/acknowledge` - Acknowledge event
- `DELETE /api/events/:id` - Delete event
- `GET /api/events/stats` - Get event statistics
- `POST /api/events/clear` - Clear events
- `GET /api/cameras/:cameraId/events` - Get camera events

## WebSocket Events

The server uses Socket.IO for real-time updates:

### Camera Events
- `camera_status` - Camera status updates
- `motion_detected` - Motion detection events
- `recording_status` - Recording status changes

### System Events
- `system_status` - System metrics updates
- `storage_status` - Storage status updates
- `new_event` - New system events

## Development

### Project Structure
```
src/
├── controllers/     # Request handlers
├── models/         # Database models
├── services/       # Business logic
├── middleware/     # Express middleware
├── utils/          # Utility functions
├── routes/         # API routes
├── scripts/        # Setup scripts
├── app.js          # Express app setup
└── index.js        # Server entry point
```

### Running Tests
```bash
npm test
```

### Logging

Logs are stored in the following locations:
- `{STORAGE_PATH}/logs/error.log` - Error logs
- `{STORAGE_PATH}/logs/combined.log` - All logs

### Storage Management

Recordings are stored in:
- `{STORAGE_PATH}/recordings/` - Video recordings
- `{STORAGE_PATH}/thumbnails/` - Video thumbnails

The system automatically manages storage based on:
- Maximum storage limit (`MAX_STORAGE_GB`)
- Retention period (configurable in settings)
- Recording priority

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License.
