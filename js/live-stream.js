// Import camera service
import { fetchCameras, retryCamera } from './cameraService.js';

// Function to create a camera card element
function createCameraCard(camera) {
    const isOffline = camera.status !== 'live';
    const cardHtml = `
        <div class="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow" id="${camera.id}-card">
            <div class="relative aspect-video bg-gray-900">
                ${isOffline ? `
                    <div class="absolute inset-0 flex items-center justify-center bg-gray-200">
                        <i class="fas fa-video-slash text-4xl text-gray-400"></i>
                    </div>
                ` : `
                    <img src="${camera.streamUrl}" 
                         alt="${camera.name}"
                         class="w-full h-full object-cover"
                         onerror="this.onerror=null; this.parentElement.innerHTML='<div class=\\'absolute inset-0 flex items-center justify-center bg-gray-200\\'><i class=\\'fas fa-video-slash text-4xl text-gray-400\\'></i></div>';">
                `}
                <div class="absolute top-4 left-4">
                    <span class="flex items-center bg-black/50 rounded-full px-3 py-1 text-white text-sm">
                        <span class="w-2 h-2 bg-${isOffline ? 'danger' : 'success'} rounded-full mr-2"></span>
                        ${isOffline ? 'Offline' : 'Live'}
                    </span>
                </div>
                <div class="absolute bottom-4 left-4">
                    <h3 class="text-white text-lg font-medium">${camera.name}</h3>
                </div>
                <div class="absolute top-4 right-4 space-x-2">
                    ${isOffline ? `
                        <button class="bg-black/50 rounded-full p-2 text-white hover:bg-black/70" onclick="window.retryConnection('${camera.id}')">
                            <i class="fas fa-redo"></i>
                        </button>
                    ` : `
                        <button class="bg-black/50 rounded-full p-2 text-white hover:bg-black/70" onclick="window.toggleFullscreen('${camera.id}')">
                            <i class="fas fa-expand"></i>
                        </button>
                    `}
                    <button class="bg-black/50 rounded-full p-2 text-white hover:bg-black/70" onclick="window.openSettings('${camera.id}')">
                        <i class="fas fa-cog"></i>
                    </button>
                </div>
            </div>
            <div class="p-4 border-t border-gray-200">
                <div class="flex justify-between items-center">
                    <div class="flex items-center space-x-2">
                        <button class="text-gray-500 hover:text-gray-700 ${isOffline ? 'opacity-50 cursor-not-allowed' : ''}" 
                                ${isOffline ? 'disabled' : ''} onclick="window.toggleMicrophone('${camera.id}')">
                            <i class="fas fa-microphone-slash"></i>
                        </button>
                        <button class="text-gray-500 hover:text-gray-700 ${isOffline ? 'opacity-50 cursor-not-allowed' : ''}" 
                                ${isOffline ? 'disabled' : ''} onclick="window.toggleAudio('${camera.id}')">
                            <i class="fas fa-volume-up"></i>
                        </button>
                    </div>
                    <div class="text-sm ${isOffline ? 'text-danger' : 'text-gray-500'}">
                        ${isOffline ? 'Connection Failed' : `${camera.resolution} • ${camera.fps}`}
                    </div>
                </div>
            </div>
        </div>
    `;
    return cardHtml;
}

// Function to initialize the camera grid
async function initializeCameraGrid() {
    const gridContainer = document.getElementById('camera-grid');
    const loadingState = document.getElementById('loading-state');
    const errorState = document.getElementById('error-state');

    if (!gridContainer) return;

    try {
        // Show loading state
        loadingState.classList.remove('hidden');
        errorState.classList.add('hidden');
        gridContainer.classList.add('hidden');

        // Fetch cameras from service
        const cameras = await fetchCameras();
        
        // Create and insert camera cards
        const cameraCards = cameras.map(camera => createCameraCard(camera)).join('');
        gridContainer.innerHTML = cameraCards;

        // Hide loading state, show grid
        loadingState.classList.add('hidden');
        gridContainer.classList.remove('hidden');
    } catch (error) {
        console.error('Failed to initialize camera grid:', error);
        loadingState.classList.add('hidden');
        errorState.classList.remove('hidden');
    }
}

// Function to toggle fullscreen for a camera
function toggleFullscreen(cameraId) {
    const cameraElement = document.getElementById(`${cameraId}-card`);
    if (!cameraElement) return;

    if (!document.fullscreenElement) {
        cameraElement.requestFullscreen().catch(err => {
            console.error(`Error attempting to enable fullscreen: ${err.message}`);
        });
    } else {
        document.exitFullscreen();
    }
}

// Function to retry connection for offline cameras
async function retryConnection(cameraId) {
    const card = document.getElementById(`${cameraId}-card`);
    if (!card) return;

    const statusElement = card.querySelector('.bg-danger');
    const statusText = card.querySelector('.flex.items-center span:last-child');
    
    if (statusElement && statusText) {
        statusElement.classList.remove('bg-danger');
        statusElement.classList.add('bg-warning');
        statusText.textContent = 'Connecting...';
    }

    try {
        const result = await retryCamera(cameraId);
        if (result.success) {
            // Refresh the entire camera grid to show updated status
            await initializeCameraGrid();
        } else {
            throw new Error('Failed to reconnect camera');
        }
    } catch (error) {
        console.error('Failed to retry camera connection:', error);
        if (statusElement && statusText) {
            statusElement.classList.remove('bg-warning');
            statusElement.classList.add('bg-danger');
            statusText.textContent = 'Offline';
        }
    }
}

// Function to toggle microphone
function toggleMicrophone(cameraId) {
    const button = document.querySelector(`#${cameraId}-card .fa-microphone-slash, #${cameraId}-card .fa-microphone`);
    if (button) {
        button.classList.toggle('fa-microphone-slash');
        button.classList.toggle('fa-microphone');
    }
}

// Function to toggle audio
function toggleAudio(cameraId) {
    const button = document.querySelector(`#${cameraId}-card .fa-volume-up, #${cameraId}-card .fa-volume-mute`);
    if (button) {
        button.classList.toggle('fa-volume-up');
        button.classList.toggle('fa-volume-mute');
    }
}

// Function to open settings modal
function openSettings(cameraId) {
    // In a real implementation, this would open a settings modal
    console.log(`Opening settings for camera ${cameraId}`);
}

// Initialize grid layout options
function initializeLayoutControls() {
    const layoutButton = document.getElementById('layout-toggle');
    if (!layoutButton) return;

    layoutButton.addEventListener('click', () => {
        const grid = document.getElementById('camera-grid');
        if (!grid) return;

        // Toggle between different grid layouts
        const currentCols = grid.classList.toString().match(/grid-cols-(\d+)/);
        if (currentCols) {
            const cols = parseInt(currentCols[1]);
            grid.classList.remove(`grid-cols-${cols}`);
            grid.classList.add(`grid-cols-${cols === 2 ? 3 : cols === 3 ? 4 : 2}`);
        }
    });
}

// Make functions available globally for onclick handlers
window.toggleFullscreen = toggleFullscreen;
window.retryConnection = retryConnection;
window.toggleMicrophone = toggleMicrophone;
window.toggleAudio = toggleAudio;
window.openSettings = openSettings;

// Initialize when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initializeCameraGrid();
    initializeLayoutControls();
});

// Handle window resize for responsive layout
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        const grid = document.getElementById('camera-grid');
        if (!grid) return;

        // Adjust grid columns based on window width
        const width = window.innerWidth;
        grid.classList.remove('grid-cols-2', 'grid-cols-3', 'grid-cols-4');
        if (width < 768) {
            grid.classList.add('grid-cols-1');
        } else if (width < 1024) {
            grid.classList.add('grid-cols-2');
        } else if (width < 1280) {
            grid.classList.add('grid-cols-3');
        } else {
            grid.classList.add('grid-cols-4');
        }
    }, 250);
});