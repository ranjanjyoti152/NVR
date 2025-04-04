// Import camera service functions
import { saveSettings } from './cameraService.js';

// Form state management
let formState = {
    cameras: {},
    recording: {},
    notifications: {},
    system: {}
};

// Toast notification
const showToast = (message, type = 'success') => {
    const toast = document.createElement('div');
    toast.className = `fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg ${
        type === 'success' ? 'bg-success text-white' : 'bg-danger text-white'
    } transition-opacity duration-300`;
    toast.textContent = message;
    document.body.appendChild(toast);

    // Fade out and remove after 3 seconds
    setTimeout(() => {
        toast.classList.add('opacity-0');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
};

// Save button handler
const handleSave = async () => {
    const saveButton = document.querySelector('[data-action="save"]');
    if (!saveButton) return;

    try {
        saveButton.disabled = true;
        saveButton.innerHTML = `
            <i class="fas fa-spinner fa-spin mr-2"></i>
            Saving Changes...
        `;

        // Collect form data
        const formData = {
            cameras: Array.from(document.querySelectorAll('[data-camera-id]')).map(camera => ({
                id: camera.dataset.cameraId,
                resolution: camera.querySelector('[data-setting="resolution"]').value,
                frameRate: camera.querySelector('[data-setting="frame-rate"]').value,
                motionDetection: camera.querySelector('[data-setting="motion-detection"]').checked,
                audioRecording: camera.querySelector('[data-setting="audio-recording"]').checked
            })),
            recording: {
                storageLocation: document.querySelector('[data-setting="storage-location"]').value,
                storageLimit: document.querySelector('[data-setting="storage-limit"]').value,
                retentionPeriod: document.querySelector('[data-setting="retention-period"]').value,
                schedule: document.querySelector('[data-setting="recording-schedule"]').value
            },
            notifications: {
                motionDetection: document.querySelector('[data-notification="motion"]').checked,
                cameraStatus: document.querySelector('[data-notification="camera-status"]').checked,
                storageAlerts: document.querySelector('[data-notification="storage"]').checked
            }
        };

        // Save settings
        const result = await saveSettings(formData);
        
        if (result.success) {
            showToast('Settings saved successfully');
            formState = { ...formData };
        } else {
            throw new Error('Failed to save settings');
        }
    } catch (error) {
        console.error('Failed to save settings:', error);
        showToast('Failed to save settings. Please try again.', 'error');
    } finally {
        saveButton.disabled = false;
        saveButton.innerHTML = `
            <i class="fas fa-save mr-2"></i>
            Save Changes
        `;
    }
};

// Handle storage location browse
const handleBrowse = () => {
    // In a real implementation, this would open a file picker
    showToast('File picker not available in demo');
};

// Handle schedule type change
const handleScheduleChange = (select) => {
    const customScheduleContainer = document.getElementById('custom-schedule-container');
    if (!customScheduleContainer) return;

    if (select.value === 'custom') {
        customScheduleContainer.classList.remove('hidden');
    } else {
        customScheduleContainer.classList.add('hidden');
    }
};

// Initialize form controls
const initializeControls = () => {
    // Save button
    const saveButton = document.querySelector('[data-action="save"]');
    if (saveButton) {
        saveButton.addEventListener('click', handleSave);
    }

    // Browse button
    const browseButton = document.querySelector('[data-action="browse"]');
    if (browseButton) {
        browseButton.addEventListener('click', handleBrowse);
    }

    // Schedule select
    const scheduleSelect = document.querySelector('[data-setting="recording-schedule"]');
    if (scheduleSelect) {
        scheduleSelect.addEventListener('change', () => handleScheduleChange(scheduleSelect));
    }

    // Camera settings dropdowns
    const cameraMenuButtons = document.querySelectorAll('[data-action="camera-menu"]');
    cameraMenuButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            const menu = button.nextElementSibling;
            if (menu) {
                menu.classList.toggle('hidden');
            }
        });
    });

    // Close dropdown menus when clicking outside
    document.addEventListener('click', () => {
        document.querySelectorAll('[data-dropdown]').forEach(dropdown => {
            dropdown.classList.add('hidden');
        });
    });

    // System maintenance buttons
    const maintenanceButtons = {
        update: document.querySelector('[data-action="check-updates"]'),
        backup: document.querySelector('[data-action="backup"]'),
        logs: document.querySelector('[data-action="view-logs"]')
    };

    if (maintenanceButtons.update) {
        maintenanceButtons.update.addEventListener('click', () => {
            maintenanceButtons.update.innerHTML = `
                <span>Checking for Updates</span>
                <i class="fas fa-spinner fa-spin"></i>
            `;
            setTimeout(() => {
                maintenanceButtons.update.innerHTML = `
                    <span>System is Up to Date</span>
                    <i class="fas fa-check"></i>
                `;
            }, 2000);
        });
    }

    if (maintenanceButtons.backup) {
        maintenanceButtons.backup.addEventListener('click', () => {
            showToast('Backup started. You will be notified when complete.');
        });
    }

    if (maintenanceButtons.logs) {
        maintenanceButtons.logs.addEventListener('click', () => {
            window.open('system-logs.html', '_blank');
        });
    }
};

// Track form changes
const trackFormChanges = () => {
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        const inputs = form.querySelectorAll('input, select');
        inputs.forEach(input => {
            input.addEventListener('change', () => {
                const saveButton = document.querySelector('[data-action="save"]');
                if (saveButton) {
                    saveButton.classList.remove('opacity-50', 'cursor-not-allowed');
                    saveButton.removeAttribute('disabled');
                }
            });
        });
    });
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initializeControls();
    trackFormChanges();
});