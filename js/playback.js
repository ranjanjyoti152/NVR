import { fetchRecordings } from './cameraService.js';

// DOM Elements
const recordingsListEl = document.getElementById('recordings-list');
const videoPlayerEl = document.getElementById('video-player');
const timelineEl = document.getElementById('timeline');
const loadingOverlay = document.getElementById('loading-overlay');
const currentTimeEl = document.getElementById('current-time');
const totalTimeEl = document.getElementById('total-time');
const playPauseBtn = document.getElementById('play-pause-btn');
const volumeBtn = document.getElementById('volume-btn');
const volumeSlider = document.getElementById('volume-slider');
const progressBar = document.getElementById('progress-bar');
const downloadBtn = document.getElementById('download-btn');

// State
let currentRecording = null;
let recordings = [];

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

// Format time (seconds to HH:MM:SS)
const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

// Format file size
const formatFileSize = (bytes) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Byte';
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
    return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
};

// Update video controls
const updateVideoControls = () => {
    if (!videoPlayerEl.paused) {
        playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
    } else {
        playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
    }

    if (videoPlayerEl.muted) {
        volumeBtn.innerHTML = '<i class="fas fa-volume-mute"></i>';
    } else {
        volumeBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
    }

    volumeSlider.value = videoPlayerEl.volume * 100;
    
    // Update progress bar
    const progress = (videoPlayerEl.currentTime / videoPlayerEl.duration) * 100;
    progressBar.style.width = `${progress}%`;
    
    // Update time display
    currentTimeEl.textContent = formatTime(videoPlayerEl.currentTime);
    totalTimeEl.textContent = formatTime(videoPlayerEl.duration);
};

// Play/Pause toggle
const togglePlayPause = () => {
    if (videoPlayerEl.paused) {
        videoPlayerEl.play();
    } else {
        videoPlayerEl.pause();
    }
};

// Volume toggle
const toggleVolume = () => {
    videoPlayerEl.muted = !videoPlayerEl.muted;
    updateVideoControls();
};

// Set volume
const setVolume = (value) => {
    videoPlayerEl.volume = value / 100;
    videoPlayerEl.muted = value === 0;
    updateVideoControls();
};

// Seek video
const seekVideo = (event) => {
    const rect = timelineEl.getBoundingClientRect();
    const pos = (event.clientX - rect.left) / rect.width;
    videoPlayerEl.currentTime = pos * videoPlayerEl.duration;
};

// Load recording
const loadRecording = (recording) => {
    currentRecording = recording;
    videoPlayerEl.src = recording.url;
    videoPlayerEl.poster = recording.thumbnail;
    downloadBtn.href = recording.url;
    downloadBtn.download = `${recording.cameraName}-${new Date(recording.startTime).toISOString()}.mp4`;
    
    // Update selected recording in the list
    document.querySelectorAll('.recording-item').forEach(item => {
        item.classList.remove('border-blue-500');
        if (item.dataset.id === recording.id) {
            item.classList.add('border-blue-500');
        }
    });
};

// Update recordings list
const updateRecordings = async () => {
    try {
        recordings = await fetchRecordings();
        
        recordingsListEl.innerHTML = recordings.map(recording => `
            <div class="recording-item border rounded-lg p-4 mb-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                currentRecording?.id === recording.id ? 'border-blue-500' : 'border-gray-200'
            }" data-id="${recording.id}" onclick="loadRecording(${JSON.stringify(recording).replace(/"/g, '&quot;')})">
                <div class="flex items-center space-x-4">
                    <div class="relative w-32 h-20 flex-shrink-0">
                        <img src="${recording.thumbnail}" 
                             alt="${recording.cameraName}"
                             class="absolute inset-0 w-full h-full object-cover rounded">
                    </div>
                    <div class="flex-grow">
                        <h3 class="font-semibold text-gray-900">${recording.cameraName}</h3>
                        <p class="text-sm text-gray-500">
                            ${new Date(recording.startTime).toLocaleString()}
                        </p>
                        <div class="flex items-center mt-2 text-sm text-gray-500">
                            <span class="mr-3">
                                <i class="fas fa-clock mr-1"></i>
                                ${recording.duration} min
                            </span>
                            <span class="mr-3">
                                <i class="fas fa-video mr-1"></i>
                                ${recording.resolution}
                            </span>
                            <span>
                                <i class="fas fa-hdd mr-1"></i>
                                ${formatFileSize(recording.fileSize * 1024 * 1024)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');

        // Load the first recording if none is selected
        if (!currentRecording && recordings.length > 0) {
            loadRecording(recordings[0]);
        }
    } catch (error) {
        showError('Failed to load recordings');
        console.error('Recordings update error:', error);
    }
};

// Initialize playback page
const initPlayback = async () => {
    toggleLoading(true);
    try {
        await updateRecordings();
        
        // Set up video player event listeners
        videoPlayerEl.addEventListener('play', updateVideoControls);
        videoPlayerEl.addEventListener('pause', updateVideoControls);
        videoPlayerEl.addEventListener('timeupdate', updateVideoControls);
        videoPlayerEl.addEventListener('volumechange', updateVideoControls);
        
        // Make functions available globally for onclick handlers
        window.loadRecording = loadRecording;
        window.togglePlayPause = togglePlayPause;
        window.toggleVolume = toggleVolume;
        window.setVolume = setVolume;
        window.seekVideo = seekVideo;
    } catch (error) {
        showError('Failed to initialize playback');
        console.error('Playback initialization error:', error);
    } finally {
        toggleLoading(false);
    }
};

// Start the playback when DOM is loaded
document.addEventListener('DOMContentLoaded', initPlayback);