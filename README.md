# Network Video Recorder (NVR) System

A modern, web-based Network Video Recorder system with an Apple-style user interface built using HTML, Tailwind CSS, and JavaScript.

## Features

### Dashboard
- Real-time system status monitoring (CPU, Memory, Storage)
- Active camera count and status overview
- Recent events feed with notifications
- Live camera preview grid
- Quick access to all system functions

### Live Stream
- Multi-camera grid view with responsive layout
- Individual camera controls
  - Full-screen view
  - Audio controls
  - Quality settings (resolution, frame rate)
- Status indicators for each camera
- Camera health monitoring
- Add/Remove camera functionality

### Video Playback
- Advanced video player with timeline controls
- Recording list with thumbnails and metadata
- Date/time based video search
- Export functionality for recorded videos
- Multi-speed playback controls
- Timeline scrubbing with preview

### Settings
- Comprehensive camera configuration
  - Resolution settings
  - Frame rate adjustment
  - Motion detection
  - Audio recording
- Recording settings
  - Storage location
  - Retention period
  - Storage limits
  - Recording schedule
- Notification preferences
- System maintenance tools

## Technology Stack

- **Frontend Framework**: Tailwind CSS for modern, utility-first styling
- **Icons**: Font Awesome for clear visual indicators
- **Typography**: Google Fonts (Inter) for modern aesthetics
- **Design**: Apple-inspired UI/UX with glass effects and smooth transitions

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/yourusername/nvr-system.git
cd nvr-system
```

2. Start a local server:
```bash
# Using Python
python3 -m http.server 8000

# Or using Node.js
npx http-server -p 8000
```

3. Open your browser and navigate to:
```
http://localhost:8000
```

## Browser Support

The NVR system is optimized for modern browsers:
- Chrome (recommended)
- Firefox
- Safari
- Edge

## Features to be Added

- Backend API integration
- Real-time notifications via WebSocket
- User authentication and access control
- Mobile app support
- Advanced motion detection algorithms
- Cloud storage integration
- AI-powered object detection
- Custom alert rules

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Design inspired by Apple's Human Interface Guidelines
- Icons provided by Font Awesome
- Typography by Google Fonts
- Demo images from Pexels