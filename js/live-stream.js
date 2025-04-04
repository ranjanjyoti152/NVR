import { fetchCameras, retryCamera } from './cameraService.js';

// DOM Elements
const cameraGridEl = document.getElementById('camera-grid');
const fullscreenModalEl = document.getElementById('fullscreen-modal');
const loadingOverlay = document.getElementById('loading-overlay');

// State
let cameras = [];
let activeFullscreenCamera = null;

// Constants
const CAMERA_REFRESH_INTERVAL = 5000; // 5 seconds

// Show/hide loading overlay
const toggleLoading = (show) => {
    loadingOverlay.style.display = show ? 'flex' : 'none';
};

// Show error message
const showError = (message) => {
    const errorEl = document.createElement('div');
    errorEl.className = 'fixed top-4 right-4 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded shadow-lg z-50';
    errorEl.innerHTML = `
        <div class="flex items-center">
            <i class="fas fa-exclamation-circle mr-2"></i>
            <p>${message}</p>
        </div>
    `;
    document.body.appendChild(errorEl);
    setTimeout(() => errorEl.remove(), 5000);
};

// Show success message
const showSuccess = (message) => {
    const successEl = document.createElement('div');
    successEl.className = 'fixed top-4 right-4 bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded shadow-lg z-50';
    successEl.innerHTML = `
        <div class="flex items-center">
            <i class="fas fa-check-circle mr-2"></i>
            <p>${message}</p>
        </div>
    `;
    document.body.appendChild(successEl);
    setTimeout(() => successEl.remove(), 5000);
};

// Handle camera retry
const handleRetry = async (cameraId) => {
    try {
        const result = await retryCamera(cameraId);
        if (result.success) {
            showSuccess('Camera reconnected successfully');
            await updateCameras(); // Refresh the camera list
        } else {
            showError('Failed to reconnect camera');
        }
    } catch (error) {
        showError('Error reconnecting camera');
        console.error('Camera retry error:', error);
    }
};

// Toggle fullscreen mode for a camera
const toggleFullscreen = (camera) => {
    if (activeFullscreenCamera === camera) {
        fullscreenModalEl.style.display = 'none';
        activeFullscreenCamera = null;
    } else {
        activeFullscreenCamera = camera;
        fullscreenModalEl.innerHTML = `
            <div class="bg-black h-full relative">
                <button onclick="document.getElementById('fullscreen-modal').style.display='none'" 
                        class="absolute top-4 right-4 text-white hover:text-gray-300">
                    <i class="fas fa-times text-2xl"></i>
                </button>
                <div class="flex items-center justify-center h-full">
                    <div class="w-full max-w-6xl mx-4">
                        <div class="relative pt-[56.25%]">
                            <img src="${camera.streamUrl}" 
                                 alt="${camera.name}"
                                 class="absolute top-0 left-0 w-full h-full object-contain">
                        </div>
                        <div class="absolute bottom-4 left-4 text-white">
                            <h3 class="text-xl font-semibold">${camera.name}</h3>
                            <p class="text-sm opacity-75">
                                ${camera.resolution} | ${camera.fps}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        `;
        fullscreenModalEl.style.display = 'block';
    }
};

// Update camera grid
const updateCameras = async () => {
    try {
        cameras = await fetchCameras();
        
        cameraGridEl.innerHTML = cameras.map(camera => `
            <div class="bg-white rounded-lg shadow-lg overflow-hidden">
                <div class="relative">
                    <div class="relative pt-[56.25%]">
                        <img src="${camera.streamUrl}" 
                             alt="${camera.name}"
                             class="absolute top-0 left-0 w-full h-full object-cover cursor-pointer"
                             onclick="toggleFullscreen(${JSON.stringify(camera).replace(/"/g, '&quot;')})">
                    </div>
                    <div class="absolute top-2 right-2 flex space-x-2">
                        <span class="px-2 py-1 rounded-full text-xs font-semibold
                                   ${camera.status === 'live' ? 'bg-green-500' : 'bg-red-500'} 
                                   text-white">
                            ${camera.status.toUpperCase()}
                        </span>
                        <span class="px-2 py-1 rounded-full text-xs font-semibold bg-gray-800 text-white">
                            ${camera.resolution}
                        </span>
                    </div>
                </div>
                <div class="p-4">
                    <div class="flex items-center justify-between">
                        <h3 class="font-semibold text-gray-700">${camera.name}</h3>
                        <div class="flex space-x-2">
                            ${camera.status === 'offline' ? `
                                <button onclick="handleRetry('${camera.id}')"
                                        class="text-blue-600 hover:text-blue-800">
                                    <i class="fas fa-sync-alt"></i>
                                </button>
                            ` : ''}
                            <button onclick="toggleFullscreen(${JSON.stringify(camera).replace(/"/g, '&quot;')})"
                                    class="text-gray-600 hover:text-gray-800">
                                <i class="fas fa-expand"></i>
                            </button>
                        </div>
                    </div>
                    <div class="mt-2 text-sm text-gray-500">
                        <p>FPS: ${camera.fps}</p>
                        <p>Last Updated: ${new Date(camera.lastUpdated).toLocaleString()}</p>
                    </div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        showError('Failed to update cameras');
        console.error('Cameras update error:', error);
    }
};

// Initialize live stream page
const initLiveStream = async () => {
    toggleLoading(true);
    try {
        await updateCameras();
        
        // Set up refresh interval
        setInterval(updateCameras, CAMERA_REFRESH_INTERVAL);
        
        // Make functions available globally for onclick handlers
        window.handleRetry = handleRetry;
        window.toggleFullscreen = toggleFullscreen;
    } catch (error) {
        showError('Failed to initialize live stream');
        console.error('Live stream initialization error:', error);
    } finally {
        toggleLoading(false);
    }
};

// Start the live stream when DOM is loaded
document.addEventListener('DOMContentLoaded', initLiveStream);