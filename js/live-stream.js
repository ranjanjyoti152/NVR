// Configuration for 50 camera streams
const cameraConfig = Array.from({ length: 50 }, (_, index) => ({
    id: `camera-${index + 1}`,
    name: `Camera ${index + 1}`,
    // In a real implementation, this would be an RTSP URL
    // For demo, we'll use a sample video or image
    streamUrl: 'https://images.pexels.com/photos/1557547/pexels-photo-1557547.jpeg',
    status: Math.random() > 0.2 ? 'live' : 'offline', // Randomly set some cameras as offline
    resolution: '1080p',
    fps: '30fps'
}));

// Function to create a camera card element
function createCameraCard(camera) {
    const isOffline = camera.status === 'offline';
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
                        <button class="bg-black/50 rounded-full p-2 text-white hover:bg-black/70" onclick="retryConnection('${camera.id}')">
                            <i class="fas fa-redo"></i>
                        </button>
                    ` : `
                        <button class="bg-black/50 rounded-full p-2 text-white hover:bg-black/70" onclick="toggleFullscreen('${camera.id}')">
                            <i class="fas fa-expand"></i>
                        </button>
                    `}
                    <button class="bg-black/50 rounded-full p-2 text-white hover:bg-black/70" onclick="openSettings('${camera.id}')">
                        <i class="fas fa-cog"></i>
                    </button>
                </div>
            </div>
            <div class="p-4 border-t border-gray-200">
                <div class="flex justify-between items-center">
                    <div class="flex items-center space-x-2">
                        <button class="text-gray-500 hover:text-gray-700 ${isOffline ? 'opacity-50 cursor-not-allowed' : ''}" 
                                ${isOffline ? 'disabled' : ''} onclick="toggleMicrophone('${camera.id}')">
                            <i class="fas fa-microphone-slash"></i>
                        </button>
                        <button class="text-gray-500 hover:text-gray-700 ${isOffline ? 'opacity-50 cursor-not-allowed' : ''}" 
                                ${isOffline ? 'disabled' : ''} onclick="toggleAudio('${camera.id}')">
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
function initializeCameraGrid() {
    const gridContainer = document.getElementById('camera-grid');
    if (!gridContainer) return;

    const cameraCards = cameraConfig.map(camera => createCameraCard(camera)).join('');
    gridContainer.innerHTML = cameraCards;
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
function retryConnection(cameraId) {
    const camera = cameraConfig.find(c => c.id === cameraId);
    if (!camera) return;

    const statusElement = document.querySelector(`#${cameraId}-card .bg-danger`);
    const statusText = document.querySelector(`#${cameraId}-card .flex.items-center span:last-child`);
    
    if (statusElement && statusText) {
        statusElement.classList.remove('bg-danger');
        statusElement.classList.add('bg-warning');
        statusText.textContent = 'Connecting...';
    }

    // Simulate reconnection attempt
    setTimeout(() => {
        const success = Math.random() > 0.5;
        if (success) {
            camera.status = 'live';
            const cardElement = document.getElementById(`${cameraId}-card`);
            if (cardElement) {
                cardElement.outerHTML = createCameraCard(camera);
            }
        } else {
            if (statusElement && statusText) {
                statusElement.classList.remove('bg-warning');
                statusElement.classList.add('bg-danger');
                statusText.textContent = 'Offline';
            }
        }
    }, 2000);
}

// Function to toggle microphone
function toggleMicrophone(cameraId) {
    const button = document.querySelector(`#${cameraId}-card .fa-microphone-slash`);
    if (button) {
        button.classList.toggle('fa-microphone-slash');
        button.classList.toggle('fa-microphone');
    }
}

// Function to toggle audio
function toggleAudio(cameraId) {
    const button = document.querySelector(`#${cameraId}-card .fa-volume-up`);
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