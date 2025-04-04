const si = require('systeminformation');
const baseLogger = require('./baseLogger');
const { EventEmitter } = require('events');

class SystemMonitor extends EventEmitter {
    constructor() {
        super();
        this.metrics = {
            cpu: {
                usage: 0,
                temperature: 0
            },
            memory: {
                used: 0,
                total: 0,
                unit: 'GB'
            },
            storage: {
                used: 0,
                total: 0,
                unit: 'GB'
            },
            uptime: 0,
            lastUpdate: new Date()
        };
        this.updateInterval = 5000; // 5 seconds
    }

    async start() {
        try {
            // Initial update
            await this.updateMetrics();

            // Set up interval for regular updates
            setInterval(async () => {
                await this.updateMetrics();
            }, this.updateInterval);

            baseLogger.info('System monitor started successfully');
        } catch (error) {
            baseLogger.error('Failed to start system monitor:', error);
            throw error;
        }
    }

    async updateMetrics() {
        try {
            // Get CPU information
            const cpuLoad = await si.currentLoad();
            const cpuTemp = await si.cpuTemperature();

            // Get memory information
            const memory = await si.mem();

            // Get storage information
            const storage = await si.fsSize();
            const mainDrive = storage[0]; // Using first drive for now

            // Update metrics
            this.metrics = {
                cpu: {
                    usage: Math.round(cpuLoad.currentLoad),
                    temperature: Math.round(cpuTemp.main || 0)
                },
                memory: {
                    used: Math.round(memory.used / 1024 / 1024 / 1024), // Convert to GB
                    total: Math.round(memory.total / 1024 / 1024 / 1024),
                    unit: 'GB'
                },
                storage: {
                    used: Math.round(mainDrive.used / 1024 / 1024 / 1024),
                    total: Math.round(mainDrive.size / 1024 / 1024 / 1024),
                    unit: 'GB'
                },
                uptime: Math.floor(si.time().uptime / 3600), // Convert to hours
                lastUpdate: new Date()
            };

            // Emit update event
            this.emit('metrics-updated', this.metrics);

            // Check for critical conditions
            this.checkCriticalConditions();

        } catch (error) {
            baseLogger.error('Error updating system metrics:', error);
            throw error;
        }
    }

    checkCriticalConditions() {
        // CPU usage alert
        if (this.metrics.cpu.usage > 90) {
            this.emit('alert', {
                type: 'cpu',
                severity: 'critical',
                message: `High CPU usage: ${this.metrics.cpu.usage}%`
            });
        }

        // CPU temperature alert
        if (this.metrics.cpu.temperature > 80) {
            this.emit('alert', {
                type: 'temperature',
                severity: 'critical',
                message: `High CPU temperature: ${this.metrics.cpu.temperature}°C`
            });
        }

        // Memory usage alert
        const memoryUsagePercent = (this.metrics.memory.used / this.metrics.memory.total) * 100;
        if (memoryUsagePercent > 90) {
            this.emit('alert', {
                type: 'memory',
                severity: 'warning',
                message: `High memory usage: ${Math.round(memoryUsagePercent)}%`
            });
        }

        // Storage usage alert
        const storageUsagePercent = (this.metrics.storage.used / this.metrics.storage.total) * 100;
        if (storageUsagePercent > 90) {
            this.emit('alert', {
                type: 'storage',
                severity: 'warning',
                message: `Storage space critical: ${Math.round(storageUsagePercent)}%`
            });
        }
    }

    getMetrics() {
        return this.metrics;
    }
}

// Create singleton instance
const systemMonitor = new SystemMonitor();

module.exports = {
    systemMonitor
};
