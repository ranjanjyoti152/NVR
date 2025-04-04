const http = require('http');
const baseLogger = require('../utils/baseLogger');

// Test camera data
const testCamera = {
    name: "Test Camera",
    streamUrl: "rtsp://demo:demo@ipvmdemo.dyndns.org:5541/onvif-media/media.amp?profile=profile_1_h264&sessiontimeout=60&streamtype=unicast",
    location: "Test Location",
    resolution: "720p",
    fps: "30fps",
    credentials: {
        username: "demo",
        password: "demo"
    }
};

function makeRequest(options, data = null) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let responseData = '';

            res.on('data', (chunk) => {
                responseData += chunk;
            });

            res.on('end', () => {
                try {
                    const parsedData = JSON.parse(responseData);
                    resolve({
                        status: res.statusCode,
                        data: parsedData
                    });
                } catch (error) {
                    reject(new Error(`Failed to parse response: ${error.message}`));
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        if (data) {
            req.write(JSON.stringify(data));
        }
        req.end();
    });
}

async function testCameraOperations() {
    baseLogger.info('Starting camera functionality tests...');

    try {
        // 1. Add a new camera
        baseLogger.info('Testing camera addition...');
        const addResult = await makeRequest({
            hostname: 'localhost',
            port: process.env.PORT || 5000,
            path: '/api/cameras',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        }, testCamera);

        baseLogger.info('Add camera response:', addResult);
        const cameraId = addResult.data.camera._id;

        // 2. Get camera details
        baseLogger.info(`Getting camera details for ID: ${cameraId}...`);
        const getResult = await makeRequest({
            hostname: 'localhost',
            port: process.env.PORT || 5000,
            path: `/api/cameras/${cameraId}`,
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        baseLogger.info('Get camera response:', getResult);

        // 3. Start camera stream
        baseLogger.info('Starting camera stream...');
        const startStreamResult = await makeRequest({
            hostname: 'localhost',
            port: process.env.PORT || 5000,
            path: `/api/cameras/${cameraId}/stream/start`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        baseLogger.info('Start stream response:', startStreamResult);

        // 4. Get camera status
        baseLogger.info('Getting camera status...');
        const statusResult = await makeRequest({
            hostname: 'localhost',
            port: process.env.PORT || 5000,
            path: `/api/cameras/${cameraId}/status`,
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        baseLogger.info('Camera status response:', statusResult);

        // 5. Start recording
        baseLogger.info('Starting recording...');
        const startRecordingResult = await makeRequest({
            hostname: 'localhost',
            port: process.env.PORT || 5000,
            path: `/api/recordings`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        }, { cameraId });

        baseLogger.info('Start recording response:', startRecordingResult);

        // Wait for 10 seconds to get some recording data
        await new Promise(resolve => setTimeout(resolve, 10000));

        // 6. Stop recording
        baseLogger.info('Stopping recording...');
        const stopRecordingResult = await makeRequest({
            hostname: 'localhost',
            port: process.env.PORT || 5000,
            path: `/api/recordings/${startRecordingResult.data.recording._id}/stop`,
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        baseLogger.info('Stop recording response:', stopRecordingResult);

        // 7. Stop camera stream
        baseLogger.info('Stopping camera stream...');
        const stopStreamResult = await makeRequest({
            hostname: 'localhost',
            port: process.env.PORT || 5000,
            path: `/api/cameras/${cameraId}/stream/stop`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        baseLogger.info('Stop stream response:', stopStreamResult);

        baseLogger.info('Camera functionality tests completed successfully');
    } catch (error) {
        baseLogger.error('Camera functionality test failed:', error);
        throw error;
    }
}

// Run tests if called directly
if (require.main === module) {
    testCameraOperations().catch(error => {
        baseLogger.error('Test script failed:', error);
        process.exit(1);
    });
}

module.exports = testCameraOperations;
