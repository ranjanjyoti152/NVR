// Import camera service functions
import { fetchRecordings } from './cameraService.js';

// DOM Elements
const videoPlayer = {
    container: document.getElementById('video-player'),
    timeline: document.querySelector('.timeline'),
    timelineProgress: document.querySelector('.timeline-progress'),
    timelineHandle: document.querySelector('.timeline-handle'),
    timeDisplay: document.querySelector('[data-time="display"]'),
    playButton: document.querySelector('[data-control="play"]'),
    volumeButton: document.querySelector('[data-control="volume"]'),
    fullscreenButton: document.querySelector('[data-control="fullscreen"]')
};

const recordingsList = {
    container: document.getElementById('recordings-list'),
    loadMoreButton: document.querySelector('[data-recordings="load-more"]')
};

// State
let currentRecording = null;
let isPlaying = false;
let currentTime = 0;
let duration = 0;

// Format time in HH:MM:SS
const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

// Update timeline position
const updateTimeline = (time) => {
    if (!duration) return;
    
    const progress = (time / duration) * 100;
    if (videoPlayer.timelineProgress) {
        videoPlayer.timelineProgress.style.width = `${progress}%`;
    }
    if (videoPlayer.timelineHandle) {
        videoPlayer.timelineHandle.style.left = `${progress}%`;
    }
    if (videoPlayer.timeDisplay) {
        videoPlayer.timeDisplay.textContent = `${formatTime(time)} / ${formatTime(duration)}`;
    }
};

// Toggle play/pause
const togglePlayPause = () => {
    if (!videoPlayer.playButton) return;
    
    isPlaying = !isPlaying;
    const icon = videoPlayer.playButton.querySelector('i');
    if (icon) {
        icon.classList.toggle('fa-play');
        icon.classList.toggle('fa-pause');
    }

    // In a real implementation, this would control video playback
    if (isPlaying) {
        // Simulate video progress
        window.playbackInterval = setInterval(() => {
            currentTime = Math.min(currentTime + 1, duration);
            updateTimeline(currentTime);
            if (currentTime >= duration) {
                togglePlayPause();
            }
        }, 1000);
    } else {
        clearInterval(window.playbackInterval);
    }
};

// Toggle volume
const toggleVolume = () => {
    if (!videoPlayer.volumeButton) return;
    
    const icon = videoPlayer.volumeButton.querySelector('i');
    if (icon) {
        icon.classList.toggle('fa-volume-up');
        icon.classList.toggle('fa-volume-mute');
    }
};

// Toggle fullscreen
const toggleFullscreen = () => {
    if (!videoPlayer.container) return;

    if (!document.fullscreenElement) {
        videoPlayer.container.requestFullscreen().catch(err => {
            console.error(`Error attempting to enable fullscreen: ${err.message}`);
        });
    } else {
        document.exitFullscreen();
    }
};

// Create recording item
const createRecordingItem = (recording, isActive = false) => {
    const startTime = new Date(recording.startTime);
    const durationInHours = recording.duration / 60;
    
    return `
        <div class="${isActive ? 'bg-primary/5 border-l-4 border-primary' : 'hover:bg-gray-50'} p-3 rounded-lg transition-colors"
             data-recording-id="${recording.id}">
            <div class="flex items-start">
                <img src="${recording.thumbnail}" 
                     alt="${recording.cameraName} Recording" 
                     class="w-20 h-12 object-cover rounded">
                <div class="ml-3 flex-1">
                    <h3 class="text-sm font-medium text-gray-900">${recording.cameraName}</h3>
                    <p class="text-xs text-gray-500">${startTime.toLocaleString()}</p>
                    <p class="text-xs text-gray-500">${durationInHours.toFixed(1)}h</p>
                </div>
            </div>
        </div>
    `;
};

// Load recordings
const loadRecordings = async () => {
    try {
        const recordings = await fetchRecordings();
        
        if (!recordingsList.container) return;

        // Display recordings
        const recordingsHTML = recordings.map((recording, index) => 
            createRecordingItem(recording, index === 0)
        ).join('');
        
        recordingsList.container.innerHTML = recordingsHTML;

        // Set up first recording as current
        if (recordings.length > 0) {
            currentRecording = recordings[0];
            duration = currentRecording.duration * 60; // Convert minutes to seconds
            updateTimeline(0);
            
            // Update recording details
            const detailsElements = {
                camera: document.querySelector('[data-details="camera"]'),
                date: document.querySelector('[data-details="date"]'),
                duration: document.querySelector('[data-details="duration"]'),
                fileSize: document.querySelector('[data-details="file-size"]')
            };

            if (detailsElements.camera) {
                detailsElements.camera.textContent = currentRecording.cameraName;
            }
            if (detailsElements.date) {
                detailsElements.date.textContent = new Date(currentRecording.startTime).toLocaleDateString();
            }
            if (detailsElements.duration) {
                detailsElements.duration.textContent = `${(currentRecording.duration / 60).toFixed(1)}h`;
            }
            if (detailsElements.fileSize) {
                detailsElements.fileSize.textContent = `${(currentRecording.fileSize / 1000).toFixed(1)} GB`;
            }
        }

        // Add click handlers to recordings
        const recordingItems = recordingsList.container.querySelectorAll('[data-recording-id]');
        recordingItems.forEach(item => {
            item.addEventListener('click', () => {
                // In a real implementation, this would load the selected recording
                recordingItems.forEach(ri => ri.classList.remove('bg-primary/5', 'border-l-4', 'border-primary'));
                item.classList.add('bg-primary/5', 'border-l-4', 'border-primary');
            });
        });

    } catch (error) {
        console.error('Failed to load recordings:', error);
        if (recordingsList.container) {
            recordingsList.container.innerHTML = `
                <div class="text-center py-8">
                    <div class="text-danger text-4xl mb-3">
                        <i class="fas fa-exclamation-circle"></i>
                    </div>
                    <p class="text-gray-900 font-medium">Failed to load recordings</p>
                    <button onclick="window.location.reload()" 
                            class="mt-4 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90">
                        Retry
                    </button>
                </div>
            `;
        }
    }
};

// Initialize playback controls
const initializeControls = () => {
    // Play/Pause button
    if (videoPlayer.playButton) {
        videoPlayer.playButton.addEventListener('click', togglePlayPause);
    }

    // Volume button
    if (videoPlayer.volumeButton) {
        videoPlayer.volumeButton.addEventListener('click', toggleVolume);
    }

    // Fullscreen button
    if (videoPlayer.fullscreenButton) {
        videoPlayer.fullscreenButton.addEventListener('click', toggleFullscreen);
    }

    // Timeline scrubbing
    if (videoPlayer.timeline) {
        videoPlayer.timeline.addEventListener('click', (e) => {
            const rect = videoPlayer.timeline.getBoundingClientRect();
            const pos = (e.clientX - rect.left) / rect.width;
            currentTime = pos * duration;
            updateTimeline(currentTime);
        });
    }

    // Load more button
    if (recordingsList.loadMoreButton) {
        recordingsList.loadMoreButton.addEventListener('click', () => {
            // In a real implementation, this would load more recordings
            recordingsList.loadMoreButton.classList.add('opacity-50', 'cursor-not-allowed');
            recordingsList.loadMoreButton.textContent = 'No more recordings';
        });
    }
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    loadRecordings();
    initializeControls();
});

// Cleanup on page unload
window.addEventListener('unload', () => {
    if (window.playbackInterval) {
        clearInterval(window.playbackInterval);
    }
});