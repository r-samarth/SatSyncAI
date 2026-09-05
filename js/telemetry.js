/* ============================================================
   SatSync AI — Telemetry Data Generator
   Generates simulated real-time satellite telemetry streams
   ============================================================ */

const Telemetry = {
    isRunning: true,
    intervalId: null,
    dataBuffer: {
        bias: [],
        drift: [],
        signal: [],
        temperature: []
    },
    maxBufferSize: 60,
    entries: [],

    /**
     * Generate a single telemetry data point
     * @returns {Object} Telemetry reading
     */
    generateDataPoint() {
        const sat = Utils.randomSat();
        const timestamp = new Date().toLocaleTimeString('en-US', { 
            hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false 
        });

        // Clock bias (ns)
        const bias = Utils.randBetween(0.1, 4.5) + Utils.gaussRandom(0, 0.3);
        
        // Frequency drift (ns/s)
        const drift = Utils.gaussRandom(0.01, 0.03);
        
        // Signal strength (dBHz)
        const signal = Utils.randBetween(35, 50) + Utils.gaussRandom(0, 2);
        
        // Temperature (°C) - satellites oscillate between -150 and +150
        const temp = Utils.randBetween(-10, 45) + Utils.gaussRandom(0, 3);

        // Status determination
        let status = 'ok';
        if (Math.abs(bias) > 3.5 || Math.abs(drift) > 0.08) status = 'warn';
        if (Math.abs(bias) > 5.0 || signal < 36) status = 'error';

        return {
            timestamp,
            satellite: sat,
            bias: Utils.formatNum(bias, 3),
            drift: Utils.formatNum(drift, 4),
            signal: Utils.formatNum(signal, 1),
            temperature: Utils.formatNum(temp, 1),
            status
        };
    },

    /**
     * Generate initial buffer of telemetry data
     */
    initializeBuffer() {
        for (let i = 0; i < this.maxBufferSize; i++) {
            this.dataBuffer.bias.push(Utils.randBetween(0.5, 3.0) + Utils.gaussRandom(0, 0.2));
            this.dataBuffer.drift.push(Utils.gaussRandom(0.02, 0.015));
            this.dataBuffer.signal.push(Utils.randBetween(38, 48) + Utils.gaussRandom(0, 1));
            this.dataBuffer.temperature.push(Utils.randBetween(10, 35) + Utils.gaussRandom(0, 2));
        }
    },

    /**
     * Add new data point to buffer (FIFO)
     */
    pushToBuffer(dataPoint) {
        const buffers = ['bias', 'drift', 'signal', 'temperature'];
        const values = [
            parseFloat(dataPoint.bias),
            parseFloat(dataPoint.drift),
            parseFloat(dataPoint.signal),
            parseFloat(dataPoint.temperature)
        ];

        buffers.forEach((key, i) => {
            this.dataBuffer[key].push(values[i]);
            if (this.dataBuffer[key].length > this.maxBufferSize) {
                this.dataBuffer[key].shift();
            }
        });
    },

    /**
     * Generate console-style entry
     */
    generateConsoleEntry() {
        const dp = this.generateDataPoint();
        return dp;
    },

    /**
     * Start streaming
     */
    start(callback, interval = 1000) {
        this.isRunning = true;
        this.initializeBuffer();
        this.intervalId = setInterval(() => {
            if (!this.isRunning) return;
            const dp = this.generateDataPoint();
            this.pushToBuffer(dp);
            this.entries.unshift(dp);
            if (this.entries.length > 50) this.entries.pop();
            if (callback) callback(dp);
        }, interval);
    },

    /**
     * Pause streaming
     */
    pause() {
        this.isRunning = !this.isRunning;
    },

    /**
     * Stop streaming
     */
    stop() {
        this.isRunning = false;
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    },

    /**
     * Clear all data
     */
    clear() {
        this.entries = [];
        Object.keys(this.dataBuffer).forEach(key => {
            this.dataBuffer[key] = [];
        });
        this.initializeBuffer();
    }
};
