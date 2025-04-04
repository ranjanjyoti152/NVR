// Simulated delay to mimic network latency
const SIMULATED_DELAY = 800;

// Realistic camera stream URLs from Pexels (high-quality security camera-like images)
const CAMERA_STREAMS = [
    'https://images.pexels.com/photos/1557547/pexels-photo-1557547.jpeg',
    'https://images.pexels.com/photos/271816/pexels-photo-271816.jpeg',
    'https://images.pexels.com/photos/273209/pexels-photo-273209.jpeg',
    'https://images.pexels.com/photos/276724/pexels-photo-276724.jpeg',
    'https://images.pexels.com/photos/280229/pexels-photo-280229.jpeg',
    'https://images.pexels.com/photos/280221/pexels-photo-280221.jpeg'
];

// Common camera locations for realistic naming
const CAMERA_LOCATIONS = [
    'Front Door',
    'Back Yard',
    'Garage',
    'Side Gate',
    'Driveway',
    'Patio'
];

// Simulate network errors randomly (10% chance)
const simulateNetworkError = () => Math.random() < 0.1;

// Helper to generate a random number between min and max
const randomBetween = (min, max) => Math.floor(Math.random() * (max - min + 1) + min);

/**
 * Fetches the list of cameras and their current status
 * @returns {Promise} Resolves with an array of camera objects
 */
export const fetchCameras = () => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            if (simulateNetworkError()) {
                reject(new Error('Failed to fetch cameras. Please check your connection.'));
                return;
            }

            const cameras = CAMERA_LOCATIONS.map((location, index) => ({
                id: `camera-${index + 1}`,
                name: `${location} Camera`,
                streamUrl: CAMERA_STREAMS[index],
                status: Math.random() > 0.2 ? 'live' : 'offline',
                resolution: ['1080p', '720p', '480p'][randomBetween(0, 2)],
                fps: ['30fps', '24fps', '15fps'][randomBetween(0, 2)],
                lastUpdated: new Date().toISOString()
            }));

            resolve(cameras);
        }, SIMULATED_DELAY);
    });
};

/**
 * Fetches system status information
 * @returns {Promise} Resolves with system status object
 */
export const fetchSystemStatus = () => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            if (simulateNetworkError()) {
                reject(new Error('Failed to fetch system status. Please try again.'));
                return;
            }

            resolve({
                cpu: {
                    usage: randomBetween(20, 80),
                    temperature: randomBetween(40, 75)
                },
                memory: {
                    used: randomBetween(2, 8),
                    total: 16,
                    unit: 'GB'
                },
                storage: {
                    used: randomBetween(200, 800),
                    total: 1000,
                    unit: 'GB'
                },
                uptime: randomBetween(1, 30),
                lastUpdate: new Date().toISOString()
            });
        }, SIMULATED_DELAY);
    });
};

/**
 * Fetches recent system events
 * @returns {Promise} Resolves with an array of event objects
 */
export const fetchRecentEvents = () => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            if (simulateNetworkError()) {
                reject(new Error('Failed to fetch recent events. Please try again.'));
                return;
            }

            const events = [
                {
                    type: 'motion',
                    camera: 'Front Door Camera',
                    timestamp: new Date(Date.now() - 120000).toISOString(),
                    severity: 'warning'
                },
                {
                    type: 'offline',
                    camera: 'Garage Camera',
                    timestamp: new Date(Date.now() - 900000).toISOString(),
                    severity: 'danger'
                },
                {
                    type: 'storage',
                    message: 'Storage space below 20%',
                    timestamp: new Date(Date.now() - 3600000).toISOString(),
                    severity: 'warning'
                }
            ];

            resolve(events);
        }, SIMULATED_DELAY);
    });
};

/**
 * Fetches recorded videos for playback
 * @returns {Promise} Resolves with an array of recording objects
 */
export const fetchRecordings = () => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            if (simulateNetworkError()) {
                reject(new Error('Failed to fetch recordings. Please try again.'));
                return;
            }

            const recordings = CAMERA_LOCATIONS.map((location, index) => ({
                id: `rec-${Date.now()}-${index}`,
                cameraName: `${location} Camera`,
                thumbnail: CAMERA_STREAMS[index],
                startTime: new Date(Date.now() - randomBetween(1, 24) * 3600000).toISOString(),
                duration: randomBetween(30, 180), // duration in minutes
                fileSize: randomBetween(100, 2000), // size in MB
                resolution: '1080p'
            }));

            resolve(recordings);
        }, SIMULATED_DELAY);
    });
};

/**
 * Simulates saving camera settings
 * @param {Object} settings - Camera settings object
 * @returns {Promise} Resolves with success message
 */
export const saveSettings = (settings) => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            if (simulateNetworkError()) {
                reject(new Error('Failed to save settings. Please try again.'));
                return;
            }

            resolve({
                success: true,
                message: 'Settings saved successfully',
                timestamp: new Date().toISOString()
            });
        }, SIMULATED_DELAY);
    });
};

/**
 * Simulates a camera connection retry
 * @param {string} cameraId - The ID of the camera to retry
 * @returns {Promise} Resolves with success/failure status
 */
export const retryCamera = (cameraId) => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            if (simulateNetworkError()) {
                reject(new Error('Failed to reconnect camera. Please try again.'));
                return;
            }

            resolve({
                success: Math.random() > 0.3, // 70% success rate
                cameraId,
                message: 'Camera reconnected successfully',
                timestamp: new Date().toISOString()
            });
        }, SIMULATED_DELAY);
    });
};