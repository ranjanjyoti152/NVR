# Network Video Recorder (NVR) System

A modern web-based Network Video Recorder system for managing and monitoring security cameras.

## Features

- **Dashboard**: Real-time system monitoring, camera status, and recent events
- **Live Stream**: Multi-camera view with individual controls and status indicators
- **Playback**: Video recording playback with timeline controls and recording management
- **Settings**: Comprehensive camera and system configuration options

## Technology Stack

- HTML5/CSS3 with Tailwind CSS for styling
- Vanilla JavaScript with ES6 Modules
- Font Awesome for icons
- Google Fonts (Inter)

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/yourusername/nvr-system.git
```

2. Navigate to the project directory:
```bash
cd nvr-system
```

3. Start a local server (e.g., using Python):
```bash
python3 -m http.server 8000
```

4. Open your browser and visit:
```
http://localhost:8000
```

## Project Structure

```
NVR/
├── css/
│   └── styles.css
├── js/
│   ├── cameraService.js    # Simulated backend API
│   ├── dashboard.js        # Dashboard functionality
│   ├── live-stream.js      # Live camera stream handling
│   ├── playback.js         # Video playback controls
│   └── settings.js         # Settings management
├── index.html              # Dashboard page
├── live-stream.html        # Live camera feeds
├── playback.html          # Recording playback
└── settings.html          # System configuration
```

## Features

### Dashboard
- System status monitoring (CPU, Memory, Storage)
- Active camera count and status
- Recent events feed
- Live camera previews

### Live Stream
- Multi-camera grid view
- Camera status indicators
- Individual camera controls
- Camera reconnection handling

### Playback
- Video player with timeline
- Recording list with thumbnails
- Playback controls
- Recording metadata

### Settings
- Camera configuration
- Recording settings
- Notification preferences
- System maintenance

## Browser Support

The application is designed to work with modern browsers that support:
- ES6 Modules
- CSS Grid/Flexbox
- Fetch API
- HTML5 Video

## Development

This is a demo implementation with simulated backend functionality. For production use:
1. Replace the simulated API in cameraService.js with real backend calls
2. Implement proper authentication and security measures
3. Use a proper build system and package manager
4. Replace CDN dependencies with local versions

## License

MIT License - feel free to use this code for your own projects.
