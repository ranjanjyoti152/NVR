const http = require('http');
const baseLogger = require('../utils/baseLogger');

// Test endpoints
const endpoints = [
    {
        path: '/api/test',
        method: 'GET',
        name: 'API Test'
    },
    {
        path: '/api/system/status',
        method: 'GET',
        name: 'System Status'
    },
    {
        path: '/api/system/settings',
        method: 'GET',
        name: 'System Settings'
    }
];

async function testEndpoint(endpoint) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: process.env.PORT || 5000,
            path: endpoint.path,
            method: endpoint.method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const req = http.request(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                resolve({
                    name: endpoint.name,
                    status: res.statusCode,
                    data: JSON.parse(data)
                });
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        req.end();
    });
}

async function runTests() {
    baseLogger.info('Starting API tests...');

    for (const endpoint of endpoints) {
        try {
            baseLogger.info(`Testing ${endpoint.name}...`);
            const result = await testEndpoint(endpoint);
            baseLogger.info(`${endpoint.name} - Status: ${result.status}`);
            baseLogger.info(`Response: ${JSON.stringify(result.data, null, 2)}`);
        } catch (error) {
            baseLogger.error(`Error testing ${endpoint.name}:`, error);
        }
    }

    baseLogger.info('API tests completed');
}

// Run tests if called directly
if (require.main === module) {
    runTests().catch(error => {
        baseLogger.error('Test script failed:', error);
        process.exit(1);
    });
}

module.exports = runTests;
