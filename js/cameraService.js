// Development mode flag - set to false in production
const DEV_MODE = true;

// Simulated delay to mimic network latency (only in dev mode)
const SIMULATED_DELAY = 800;

// API endpoints
const API_BASE_URL = '/api';
const ENDPOINTS = {
    cameras: `${API_BASE_URL}/cameras`,
    systemStatus: `${API_BASE_URL}/system-status`,
    events: `${API_BASE_URL}/events`,
    recordings: `${API_BASE_URL}/recordings`,
    settings: `${API_BASE_URL}/settings`
};

// Development mode data
const DEV_CAMERA_STREAMS = [
    'https://images.pexels.com/photos/1557547/pexels-photo-1557547.jpeg',
    'https://images.pexels.com/photos/271816/pexels-photo-271816.jpeg',
    'https://images.pexels.com/photos/273209/pexels-photo-273209.jpeg',
    'https://images.pexels.com/photos/276724/pexels-photo-276724.jpeg',
    'https://images.pexels.com/photos/280229/pexels-photo-280229.jpeg',
    'https://images.pexels.com/photos/280221/pexels-photo-280221.jpeg'
];

const DEV_CAMERA_LOCATIONS = [
    'Front Door',
    'Back Yard',
    'Garage',
    'Side Gate',
    'Driveway',
    'Patio'
];

// Helper function for making API requests
async function apiRequest(endpoint, options = {}) {
    if (DEV_MODE) {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(getDevData(endpoint));
            }, SIMULATED_DELAY);
        });
    }

    try {
        const response = await fetch(endpoint, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });

        if (!response.ok) {
            throw new Error(`API request failed: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error('API request error:', error);
        throw new Error(`Failed to fetch data: ${error.message}`);
    }
}

// Development mode data generator
function getDevData(endpoint) {
    const randomBetween = (min, max) => Math.floor(Math.random() * (max - min + 1) + min);

    switch (endpoint) {
        case ENDPOINTS.cameras:
            return DEV_CAMERA_LOCATIONS.map((location, index) => ({
                id: `camera-${index + 1}`,
                name: `${location} Camera`,
                streamUrl: DEV_CAMERA_STREAMS[index],
                status: Math.random() > 0.2 ? 'live' : 'offline',
                resolution: ['1080p', '720p', '480p'][randomBetween(0, 2)],
                fps: ['30fps', '24fps', '15fps'][randomBetween(0, 2)],
                lastUpdated: new Date().toISOString()
            }));

        case ENDPOINTS.systemStatus:
            return {
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
            };

        case ENDPOINTS.events:
            return [
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

        case ENDPOINTS.recordings:
            return DEV_CAMERA_LOCATIONS.map((location, index) => ({
                id: `rec-${Date.now()}-${index}`,
                cameraName: `${location} Camera`,
                thumbnail: DEV_CAMERA_STREAMS[index],
                url: DEV_CAMERA_STREAMS[index], // In dev mode, using static images instead of video
                startTime: new Date(Date.now() - randomBetween(1, 24) * 3600000).toISOString(),
                duration: randomBetween(30, 180),
                fileSize: randomBetween(100, 2000),
                resolution: '1080p'
            }));

        default:
            return { success: true, message: 'Operation completed successfully' };
    }
}

/**
 * Fetches the list of cameras and their current status
 * @returns {Promise} Resolves with an array of camera objects
 */
export const fetchCameras = () => {
    return apiRequest(ENDPOINTS.cameras);
};

/**
 * Fetches system status information
 * @returns {Promise} Resolves with system status object
 */
export const fetchSystemStatus = () => {
    return apiRequest(ENDPOINTS.systemStatus);
};

/**
 * Fetches recent system events
 * @returns {Promise} Resolves with an array of event objects
 */
export const fetchRecentEvents = () => {
    return apiRequest(ENDPOINTS.events);
};

/**
 * Fetches recorded videos for playback
 * @returns {Promise} Resolves with an array of recording objects
 */
export const fetchRecordings = () => {
    return apiRequest(ENDPOINTS.recordings);
};

/**
 * Saves camera settings
 * @param {Object} settings - Camera settings object
 * @returns {Promise} Resolves with success message
 */
export const saveSettings = (settings) => {
    return apiRequest(ENDPOINTS.settings, {
        method: 'POST',
        body: JSON.stringify(settings)
    });
};

/**
 * Retries camera connection
 * @param {string} cameraId - The ID of the camera to retry
 * @returns {Promise} Resolves with success/failure status
 */
export const retryCamera = (cameraId) => {
    return apiRequest(`${ENDPOINTS.cameras}/${cameraId}/retry`, {
        method: 'POST'
    });
};