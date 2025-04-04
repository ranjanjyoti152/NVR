// Import the camera service functions
import { fetchSystemStatus, fetchCameras, fetchRecentEvents } from './cameraService.js';

// DOM Elements
const systemStatusCard = {
    cpuUsage: document.querySelector('[data-status="cpu-usage"]'),
    memoryUsage: document.querySelector('[data-status="memory-usage"]'),
    storage: document.querySelector('[data-status="storage"]'),
    statusBadge: document.querySelector('[data-status="system-badge"]')
};

const camerasCard = {
    activeCount: document.querySelector('[data-cameras="active-count"]'),
    totalCount: document.querySelector('[data-cameras="total-count"]'),
    progressBar: document.querySelector('[data-cameras="progress-bar"]')
};

const eventsContainer = document.querySelector('[data-events="container"]');
const cameraFeedsGrid = document.querySelector('[data-camera-feeds="grid"]');

// Loading and error states
const showLoading = (element) => {
    if (!element) return;
    element.innerHTML = `
        <div class="flex items-center justify-center p-4">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
    `;
};

const showError = (element, message) => {
    if (!element) return;
    element.innerHTML = `
        <div class="flex items-center justify-center p-4 text-danger">
            <i class="fas fa-exclamation-circle mr-2"></i>
            <span>${message}</span>
        </div>
    `;
};

// Update system status card
const updateSystemStatus = async () => {
    try {
        const status = await fetchSystemStatus();
        
        if (systemStatusCard.cpuUsage) {
            systemStatusCard.cpuUsage.textContent = `${status.cpu.usage}%`;
        }
        
        if (systemStatusCard.memoryUsage) {
            systemStatusCard.memoryUsage.textContent = 
                `${status.memory.used} ${status.memory.unit}`;
        }
        
        if (systemStatusCard.storage) {
            const freeStorage = status.storage.total - status.storage.used;
            systemStatusCard.storage.textContent = 
                `${freeStorage} ${status.storage.unit} Free`;
        }

        // Update status badge
        if (systemStatusCard.statusBadge) {
            const isHealthy = status.cpu.usage < 80 && 
                            (status.memory.used / status.memory.total) < 0.8 &&
                            (status.storage.used / status.storage.total) < 0.8;
            
            systemStatusCard.statusBadge.textContent = isHealthy ? 'Active' : 'Warning';
            systemStatusCard.statusBadge.className = 
                `px-3 py-1 bg-${isHealthy ? 'success' : 'warning'} bg-opacity-10 ` +
                `text-${isHealthy ? 'success' : 'warning'} rounded-full text-sm`;
        }
    } catch (error) {
        console.error('Failed to update system status:', error);
        showError(document.querySelector('[data-status="card"]'), 
                 'Failed to load system status');
    }
};

// Update active cameras card
const updateCamerasCard = async () => {
    try {
        const cameras = await fetchCameras();
        const activeCameras = cameras.filter(cam => cam.status === 'live');
        
        if (camerasCard.activeCount) {
            camerasCard.activeCount.textContent = activeCameras.length;
        }
        
        if (camerasCard.totalCount) {
            camerasCard.totalCount.textContent = cameras.length;
        }
        
        if (camerasCard.progressBar) {
            const percentage = (activeCameras.length / cameras.length) * 100;
            camerasCard.progressBar.style.width = `${percentage}%`;
        }
    } catch (error) {
        console.error('Failed to update cameras card:', error);
        showError(document.querySelector('[data-cameras="card"]'), 
                 'Failed to load camera status');
    }
};

// Update recent events
const updateRecentEvents = async () => {
    if (!eventsContainer) return;
    
    try {
        const events = await fetchRecentEvents();
        
        const eventIcons = {
            motion: 'fas fa-exclamation-triangle text-warning',
            offline: 'fas fa-times-circle text-danger',
            storage: 'fas fa-hdd text-warning'
        };

        const eventHTML = events.map(event => `
            <div class="flex items-start space-x-3">
                <span class="${eventIcons[event.type] || 'fas fa-info-circle text-info'}"></span>
                <div>
                    <p class="text-sm text-gray-900">
                        ${event.type === 'motion' ? `Motion Detected - ${event.camera}` :
                          event.type === 'offline' ? `${event.camera} Offline` :
                          event.message}
                    </p>
                    <p class="text-xs text-gray-500">
                        ${new Date(event.timestamp).toLocaleString()}
                    </p>
                </div>
            </div>
        `).join('');

        eventsContainer.innerHTML = eventHTML;
    } catch (error) {
        console.error('Failed to update recent events:', error);
        showError(eventsContainer, 'Failed to load recent events');
    }
};

// Update camera feeds
const updateCameraFeeds = async () => {
    if (!cameraFeedsGrid) return;
    
    try {
        const cameras = await fetchCameras();
        const activeCameras = cameras.slice(0, 3); // Show only first 3 cameras

        const feedsHTML = activeCameras.map(camera => `
            <div class="relative rounded-lg overflow-hidden bg-gray-100 aspect-video">
                ${camera.status === 'live' ? `
                    <img src="${camera.streamUrl}" 
                         alt="${camera.name}" 
                         class="w-full h-full object-cover">
                ` : `
                    <div class="absolute inset-0 flex items-center justify-center bg-gray-200">
                        <i class="fas fa-video-slash text-4xl text-gray-400"></i>
                    </div>
                `}
                <div class="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/70 to-transparent">
                    <div class="flex justify-between items-center">
                        <span class="text-white text-sm font-medium">${camera.name}</span>
                        <span class="flex items-center">
                            <span class="w-2 h-2 bg-${camera.status === 'live' ? 'success' : 'danger'} rounded-full mr-1"></span>
                            <span class="text-white text-xs">${camera.status === 'live' ? 'Live' : 'Offline'}</span>
                        </span>
                    </div>
                </div>
            </div>
        `).join('');

        cameraFeedsGrid.innerHTML = feedsHTML;
    } catch (error) {
        console.error('Failed to update camera feeds:', error);
        showError(cameraFeedsGrid, 'Failed to load camera feeds');
    }
};

// Initialize dashboard
const initializeDashboard = () => {
    // Initial load
    updateSystemStatus();
    updateCamerasCard();
    updateRecentEvents();
    updateCameraFeeds();

    // Set up periodic updates
    setInterval(updateSystemStatus, 5000);  // Every 5 seconds
    setInterval(updateCamerasCard, 10000);  // Every 10 seconds
    setInterval(updateRecentEvents, 15000); // Every 15 seconds
    setInterval(updateCameraFeeds, 20000);  // Every 20 seconds
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeDashboard);