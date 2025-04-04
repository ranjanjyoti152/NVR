const axios = require('axios');
const baseLogger = require('../utils/baseLogger');

const testCamera = {
    name: "Test Camera",
    streamUrl: "rtsp://admin:admin@123@192.168.100.11:554/0",
    location: "Test Location",
    resolution: "720p",
    fps: "30fps",
    credentials: {
        username: "admin",
        password: "admin@123"
    }
};

async function addTestCamera() {
    try {
        baseLogger.info('Adding test camera...');
        
        // Add camera
        const response = await axios.post('http://localhost:5000/api/cameras', testCamera, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (response.data.success) {
            baseLogger.info('Test camera added successfully:', response.data.camera);
            
            // Start the stream
            const cameraId = response.data.camera._id;
            const streamResponse = await axios.post(`http://localhost:5000/api/cameras/${cameraId}/stream/start`, {}, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (streamResponse.data.success) {
                baseLogger.info('Camera stream started successfully');
                
                // Get camera status
                const statusResponse = await axios.get(`http://localhost:5000/api/cameras/${cameraId}/status`, {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                
                baseLogger.info('Camera status:', statusResponse.data);

                // Wait for 30 seconds to test the stream
                baseLogger.info('Waiting 30 seconds to test stream...');
                await new Promise(resolve => setTimeout(resolve, 30000));

                // Stop the stream
                const stopResponse = await axios.post(`http://localhost:5000/api/cameras/${cameraId}/stream/stop`, {}, {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                if (stopResponse.data.success) {
                    baseLogger.info('Camera stream stopped successfully');
                } else {
                    baseLogger.error('Failed to stop camera stream:', stopResponse.data.message);
                }
            } else {
                baseLogger.error('Failed to start camera stream:', streamResponse.data.message);
            }
        } else {
            baseLogger.error('Failed to add test camera:', response.data.message);
        }
    } catch (error) {
        baseLogger.error('Error in test script:', error.response?.data?.message || error.message);
        if (error.response?.data) {
            baseLogger.error('Full error response:', error.response.data);
        }
    }
}

// Run if called directly
if (require.main === module) {
    addTestCamera().catch(error => {
        baseLogger.error('Test script failed:', error);
        process.exit(1);
    });
}

module.exports = addTestCamera;
