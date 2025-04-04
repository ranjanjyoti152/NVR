import { fetchCameras, fetchSystemStatus, fetchRecentEvents } from './cameraService.js';

// DOM Elements
const systemStatusEl = document.getElementById('system-status');
const camerasGridEl = document.getElementById('cameras-grid');
const eventsListEl = document.getElementById('events-list');
const loadingOverlay = document.getElementById('loading-overlay');

// Refresh intervals (in milliseconds)
const SYSTEM_STATUS_REFRESH = 5000;
const CAMERAS_REFRESH = 10000;
const EVENTS_REFRESH = 30000;

// Show/hide loading overlay
const toggleLoading = (show) => {
    loadingOverlay.style.display = show ? 'flex' : 'none';
};

// Display error message
const showError = (message) => {
    const errorEl = document.createElement('div');
    errorEl.className = 'bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded';
    errorEl.innerHTML = `
        <div class="flex items-center">
            <i class="fas fa-exclamation-circle mr-2"></i>
            <p>${message}</p>
        </div>
    `;
    document.querySelector('main').prepend(errorEl);
    setTimeout(() => errorEl.remove(), 5000);
};

// Update system status metrics
const updateSystemStatus = async () => {
    try {
        const status = await fetchSystemStatus();
        
        systemStatusEl.innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <!-- CPU Status -->
                <div class="bg-white rounded-lg shadow p-4">
                    <div class="flex items-center justify-between">
                        <h3 class="text-gray-700 font-semibold">
                            <i class="fas fa-microchip mr-2"></i>CPU
                        </h3>
                        <span class="text-${status.cpu.usage > 80 ? 'red' : 'green'}-500">
                            ${status.cpu.usage}%
                        </span>
                    </div>
                    <div class="mt-2 bg-gray-200 rounded-full">
                        <div class="bg-blue-500 rounded-full h-2" 
                             style="width: ${status.cpu.usage}%">
                        </div>
                    </div>
                    <p class="text-sm text-gray-500 mt-2">
                        Temperature: ${status.cpu.temperature}°C
                    </p>
                </div>

                <!-- Memory Status -->
                <div class="bg-white rounded-lg shadow p-4">
                    <div class="flex items-center justify-between">
                        <h3 class="text-gray-700 font-semibold">
                            <i class="fas fa-memory mr-2"></i>Memory
                        </h3>
                        <span class="text-${(status.memory.used/status.memory.total > 0.8) ? 'red' : 'green'}-500">
                            ${status.memory.used}/${status.memory.total} ${status.memory.unit}
                        </span>
                    </div>
                    <div class="mt-2 bg-gray-200 rounded-full">
                        <div class="bg-blue-500 rounded-full h-2" 
                             style="width: ${(status.memory.used/status.memory.total)*100}%">
                        </div>
                    </div>
                </div>

                <!-- Storage Status -->
                <div class="bg-white rounded-lg shadow p-4">
                    <div class="flex items-center justify-between">
                        <h3 class="text-gray-700 font-semibold">
                            <i class="fas fa-hdd mr-2"></i>Storage
                        </h3>
                        <span class="text-${(status.storage.used/status.storage.total > 0.8) ? 'red' : 'green'}-500">
                            ${status.storage.used}/${status.storage.total} ${status.storage.unit}
                        </span>
                    </div>
                    <div class="mt-2 bg-gray-200 rounded-full">
                        <div class="bg-blue-500 rounded-full h-2" 
                             style="width: ${(status.storage.used/status.storage.total)*100}%">
                        </div>
                    </div>
                </div>
            </div>
        `;
    } catch (error) {
        showError('Failed to update system status');
        console.error('System status error:', error);
    }
};

// Update cameras grid
const updateCameras = async () => {
    try {
        const cameras = await fetchCameras();
        
        camerasGridEl.innerHTML = cameras.map(camera => `
            <div class="bg-white rounded-lg shadow overflow-hidden">
                <div class="relative">
                    <img src="${camera.streamUrl}" 
                         alt="${camera.name}" 
                         class="w-full h-48 object-cover">
                    <div class="absolute top-2 right-2">
                        <span class="px-2 py-1 rounded-full text-xs font-semibold
                                   ${camera.status === 'live' ? 'bg-green-500' : 'bg-red-500'} 
                                   text-white">
                            ${camera.status.toUpperCase()}
                        </span>
                    </div>
                </div>
                <div class="p-4">
                    <h3 class="font-semibold text-gray-700">${camera.name}</h3>
                    <div class="mt-2 text-sm text-gray-500">
                        <p>Resolution: ${camera.resolution}</p>
                        <p>FPS: ${camera.fps}</p>
                    </div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        showError('Failed to update cameras');
        console.error('Cameras update error:', error);
    }
};

// Update recent events
const updateEvents = async () => {
    try {
        const events = await fetchRecentEvents();
        
        eventsListEl.innerHTML = events.map(event => `
            <div class="bg-white rounded-lg shadow p-4 mb-4">
                <div class="flex items-center justify-between">
                    <div class="flex items-center">
                        <i class="fas fa-${getEventIcon(event.type)} text-${getSeverityColor(event.severity)}-500 mr-3"></i>
                        <div>
                            <h4 class="font-semibold text-gray-700">
                                ${getEventTitle(event)}
                            </h4>
                            <p class="text-sm text-gray-500">
                                ${new Date(event.timestamp).toLocaleString()}
                            </p>
                        </div>
                    </div>
                    <span class="px-2 py-1 rounded-full text-xs font-semibold
                               bg-${getSeverityColor(event.severity)}-100 
                               text-${getSeverityColor(event.severity)}-800">
                        ${event.severity.toUpperCase()}
                    </span>
                </div>
            </div>
        `).join('');
    } catch (error) {
        showError('Failed to update events');
        console.error('Events update error:', error);
    }
};

// Helper functions
const getEventIcon = (type) => {
    const icons = {
        motion: 'walking',
        offline: 'exclamation-triangle',
        storage: 'hdd',
        default: 'info-circle'
    };
    return icons[type] || icons.default;
};

const getSeverityColor = (severity) => {
    const colors = {
        danger: 'red',
        warning: 'yellow',
        info: 'blue',
        default: 'gray'
    };
    return colors[severity] || colors.default;
};

const getEventTitle = (event) => {
    if (event.type === 'motion') {
        return `Motion detected - ${event.camera}`;
    } else if (event.type === 'offline') {
        return `Camera offline - ${event.camera}`;
    }
    return event.message || 'System Event';
};

// Initialize dashboard
const initDashboard = async () => {
    toggleLoading(true);
    try {
        await Promise.all([
            updateSystemStatus(),
            updateCameras(),
            updateEvents()
        ]);
        
        // Set up refresh intervals
        setInterval(updateSystemStatus, SYSTEM_STATUS_REFRESH);
        setInterval(updateCameras, CAMERAS_REFRESH);
        setInterval(updateEvents, EVENTS_REFRESH);
    } catch (error) {
        showError('Failed to initialize dashboard');
        console.error('Dashboard initialization error:', error);
    } finally {
        toggleLoading(false);
    }
};

// Start the dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', initDashboard);