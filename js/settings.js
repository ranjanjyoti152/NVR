import { fetchCameras, saveSettings } from './cameraService.js';

// DOM Elements
const cameraSettingsForm = document.getElementById('camera-settings-form');
const recordingSettingsForm = document.getElementById('recording-settings-form');
const systemSettingsForm = document.getElementById('system-settings-form');
const loadingOverlay = document.getElementById('loading-overlay');

// Show/hide loading overlay
const toggleLoading = (show) => {
    loadingOverlay.style.display = show ? 'flex' : 'none';
};

// Show notification
const showNotification = (message, type = 'success') => {
    const notificationEl = document.createElement('div');
    notificationEl.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
        type === 'success' ? 'bg-green-100 text-green-700 border-l-4 border-green-500' :
        type === 'error' ? 'bg-red-100 text-red-700 border-l-4 border-red-500' :
        'bg-blue-100 text-blue-700 border-l-4 border-blue-500'
    }`;
    
    notificationEl.innerHTML = `
        <div class="flex items-center">
            <i class="fas fa-${type === 'success' ? 'check-circle' : 
                          type === 'error' ? 'exclamation-circle' : 
                          'info-circle'} mr-2"></i>
            <p>${message}</p>
        </div>
    `;
    
    document.body.appendChild(notificationEl);
    setTimeout(() => notificationEl.remove(), 5000);
};

// Validate camera settings
const validateCameraSettings = (settings) => {
    const errors = [];
    
    if (!settings.name.trim()) {
        errors.push('Camera name is required');
    }
    
    if (!settings.resolution) {
        errors.push('Resolution must be selected');
    }
    
    if (!settings.fps || settings.fps < 1 || settings.fps > 60) {
        errors.push('FPS must be between 1 and 60');
    }
    
    if (!settings.streamUrl.trim() || !isValidUrl(settings.streamUrl)) {
        errors.push('Valid stream URL is required');
    }
    
    return errors;
};

// Validate recording settings
const validateRecordingSettings = (settings) => {
    const errors = [];
    
    if (!settings.storageLimit || settings.storageLimit < 1) {
        errors.push('Storage limit must be at least 1GB');
    }
    
    if (!settings.retentionDays || settings.retentionDays < 1) {
        errors.push('Retention period must be at least 1 day');
    }
    
    return errors;
};

// URL validation helper
const isValidUrl = (url) => {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
};

// Load camera settings
const loadCameraSettings = async () => {
    try {
        const cameras = await fetchCameras();
        
        const cameraListEl = document.getElementById('camera-list');
        cameraListEl.innerHTML = cameras.map(camera => `
            <div class="bg-white rounded-lg shadow p-4 mb-4">
                <form class="camera-form" data-camera-id="${camera.id}">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="text-lg font-semibold text-gray-700">
                            ${camera.name}
                        </h3>
                        <span class="px-2 py-1 rounded-full text-xs font-semibold
                                   ${camera.status === 'live' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                            ${camera.status.toUpperCase()}
                        </span>
                    </div>
                    
                    <div class="space-y-4">
                        <!-- Camera Name -->
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">
                                Camera Name
                            </label>
                            <input type="text" name="name" value="${camera.name}"
                                   class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                   required>
                        </div>
                        
                        <!-- Stream URL -->
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">
                                Stream URL
                            </label>
                            <input type="url" name="streamUrl" value="${camera.streamUrl}"
                                   class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                   required>
                        </div>
                        
                        <!-- Resolution -->
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">
                                Resolution
                            </label>
                            <select name="resolution"
                                    class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                                <option value="1080p" ${camera.resolution === '1080p' ? 'selected' : ''}>1080p</option>
                                <option value="720p" ${camera.resolution === '720p' ? 'selected' : ''}>720p</option>
                                <option value="480p" ${camera.resolution === '480p' ? 'selected' : ''}>480p</option>
                            </select>
                        </div>
                        
                        <!-- FPS -->
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">
                                FPS
                            </label>
                            <input type="number" name="fps" value="${camera.fps.replace('fps', '')}"
                                   min="1" max="60"
                                   class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                   required>
                        </div>
                    </div>
                    
                    <div class="flex justify-end mt-4">
                        <button type="submit"
                                class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        `).join('');

        // Add form submit handlers
        document.querySelectorAll('.camera-form').forEach(form => {
            form.addEventListener('submit', handleCameraSettingsSubmit);
        });
    } catch (error) {
        showNotification('Failed to load camera settings', 'error');
        console.error('Camera settings load error:', error);
    }
};

// Handle camera settings form submit
const handleCameraSettingsSubmit = async (event) => {
    event.preventDefault();
    const form = event.target;
    const cameraId = form.dataset.cameraId;
    
    const settings = {
        id: cameraId,
        name: form.name.value,
        streamUrl: form.streamUrl.value,
        resolution: form.resolution.value,
        fps: `${form.fps.value}fps`
    };
    
    const errors = validateCameraSettings(settings);
    if (errors.length > 0) {
        showNotification(errors.join(', '), 'error');
        return;
    }
    
    toggleLoading(true);
    try {
        await saveSettings(settings);
        showNotification('Camera settings saved successfully');
    } catch (error) {
        showNotification('Failed to save camera settings', 'error');
        console.error('Camera settings save error:', error);
    } finally {
        toggleLoading(false);
    }
};

// Handle recording settings form submit
const handleRecordingSettingsSubmit = async (event) => {
    event.preventDefault();
    const form = event.target;
    
    const settings = {
        storageLimit: parseInt(form.storageLimit.value),
        retentionDays: parseInt(form.retentionDays.value),
        recordOnMotion: form.recordOnMotion.checked,
        scheduleRecording: form.scheduleRecording.checked,
        schedule: {
            start: form.scheduleStart.value,
            end: form.scheduleEnd.value
        }
    };
    
    const errors = validateRecordingSettings(settings);
    if (errors.length > 0) {
        showNotification(errors.join(', '), 'error');
        return;
    }
    
    toggleLoading(true);
    try {
        await saveSettings({ recording: settings });
        showNotification('Recording settings saved successfully');
    } catch (error) {
        showNotification('Failed to save recording settings', 'error');
        console.error('Recording settings save error:', error);
    } finally {
        toggleLoading(false);
    }
};

// Handle system settings form submit
const handleSystemSettingsSubmit = async (event) => {
    event.preventDefault();
    const form = event.target;
    
    const settings = {
        systemName: form.systemName.value,
        location: form.location.value,
        notifications: {
            email: form.emailNotifications.checked,
            push: form.pushNotifications.checked,
            motion: form.motionAlerts.checked,
            offline: form.offlineAlerts.checked
        }
    };
    
    toggleLoading(true);
    try {
        await saveSettings({ system: settings });
        showNotification('System settings saved successfully');
    } catch (error) {
        showNotification('Failed to save system settings', 'error');
        console.error('System settings save error:', error);
    } finally {
        toggleLoading(false);
    }
};

// Initialize settings page
const initSettings = async () => {
    toggleLoading(true);
    try {
        await loadCameraSettings();
        
        // Add form submit handlers
        recordingSettingsForm?.addEventListener('submit', handleRecordingSettingsSubmit);
        systemSettingsForm?.addEventListener('submit', handleSystemSettingsSubmit);
    } catch (error) {
        showNotification('Failed to initialize settings', 'error');
        console.error('Settings initialization error:', error);
    } finally {
        toggleLoading(false);
    }
};

// Start the settings page when DOM is loaded
document.addEventListener('DOMContentLoaded', initSettings);