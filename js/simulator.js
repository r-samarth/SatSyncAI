/* ============================================================
   SatSync AI — Clock Simulation Engine
   Physics-based satellite clock behaviour simulator
   ============================================================ */

const Simulator = {
    // Clock stability parameters (Allan deviation per second)
    clockParams: {
        rubidium:  { stability: 1e-12, drift: 2e-14, noise: 5e-13, label: 'Rubidium (Rb)' },
        cesium:    { stability: 5e-13, drift: 1e-14, noise: 3e-13, label: 'Cesium (Cs)' },
        hydrogen:  { stability: 1e-13, drift: 5e-15, noise: 1e-13, label: 'Hydrogen Maser (PHM)' }
    },

    // Relativistic effects (microseconds/day)
    relativisticEffects: {
        specialRelativity: -7,   // clocks lose 7 μs/day
        generalRelativity: 45,   // clocks gain 45 μs/day
        netEffect: 38            // net gain of 38 μs/day
    },

    /**
     * Run a full clock simulation
     * @param {Object} config - Simulation parameters
     * @returns {Object} Simulation results with time series data
     */
    runSimulation(config) {
        const {
            clockType = 'rubidium',
            initialBias = 0.5,
            driftRate = 0.02,
            noiseLevel = 0.3,
            duration = 6,
            injectAnomaly = true,
            includeRelativistic = true,
            samplesPerHour = 60
        } = config;

        const totalSamples = duration * samplesPerHour;
        const params = this.clockParams[clockType];
        
        // Initialize arrays
        const time = [];
        const rawError = [];
        const driftComponent = [];
        const noiseComponent = [];
        const relativisticComponent = [];
        const anomalyFlags = [];
        const combinedError = [];

        // Anomaly injection parameters
        let anomalyStart = -1;
        let anomalyDuration = 0;
        let anomalyMagnitude = 0;
        let anomalyCount = 0;

        if (injectAnomaly) {
            anomalyStart = Utils.randInt(Math.floor(totalSamples * 0.3), Math.floor(totalSamples * 0.7));
            anomalyDuration = Utils.randInt(5, 20);
            anomalyMagnitude = Utils.randBetween(3, 8) * (Math.random() > 0.5 ? 1 : -1);
        }

        // Generate clock error time series
        for (let i = 0; i < totalSamples; i++) {
            const t = i / samplesPerHour; // time in hours
            time.push(t);

            // 1. Deterministic drift (quadratic polynomial model)
            const drift = initialBias + driftRate * t + 0.001 * t * t;
            driftComponent.push(drift);

            // 2. Stochastic noise (white + flicker noise)
            const whiteNoise = Utils.gaussRandom(0, noiseLevel);
            const flickerNoise = Utils.gaussRandom(0, noiseLevel * 0.3) * Math.sin(2 * Math.PI * t / 2.5);
            const noise = whiteNoise + flickerNoise;
            noiseComponent.push(noise);

            // 3. Relativistic effect (if enabled)
            let relEffect = 0;
            if (includeRelativistic) {
                // Convert μs/day to ns for our time scale
                relEffect = (this.relativisticEffects.netEffect * 1000 * t) / 24;
                // Pre-corrected (factory adjustment), so residual is small periodic term
                relEffect = 0.05 * Math.sin(2 * Math.PI * t / 12); // residual periodic variation
            }
            relativisticComponent.push(relEffect);

            // 4. Anomaly injection
            let anomaly = 0;
            let isAnomaly = false;
            if (injectAnomaly && i >= anomalyStart && i < anomalyStart + anomalyDuration) {
                const anomalyProgress = (i - anomalyStart) / anomalyDuration;
                anomaly = anomalyMagnitude * Math.exp(-0.5 * Math.pow((anomalyProgress - 0.3) / 0.2, 2));
                isAnomaly = true;
                if (i === anomalyStart) anomalyCount++;
            }
            // Second smaller anomaly
            const anomaly2Start = anomalyStart + Math.floor(totalSamples * 0.25);
            if (injectAnomaly && i >= anomaly2Start && i < anomaly2Start + 8) {
                const p = (i - anomaly2Start) / 8;
                anomaly += (anomalyMagnitude * 0.4) * Math.sin(Math.PI * p);
                if (!isAnomaly) { isAnomaly = true; anomalyCount++; }
            }

            anomalyFlags.push(isAnomaly);

            // Combined error
            const total = drift + noise + relEffect + anomaly;
            rawError.push(total);
            combinedError.push(total);
        }

        // Compute statistics
        const maxError = Math.max(...combinedError.map(Math.abs));
        const meanError = combinedError.reduce((a, b) => a + b, 0) / combinedError.length;
        const stdDev = Math.sqrt(
            combinedError.reduce((sum, val) => sum + Math.pow(val - meanError, 2), 0) / combinedError.length
        );

        return {
            time,
            rawError,
            driftComponent,
            noiseComponent,
            relativisticComponent,
            anomalyFlags,
            combinedError,
            stats: {
                maxError: Utils.formatNum(maxError, 3),
                meanError: Utils.formatNum(meanError, 3),
                stdDev: Utils.formatNum(stdDev, 3),
                anomalyCount: anomalyCount,
                totalSamples,
                duration,
                clockType: params.label
            },
            config
        };
    },

    /**
     * Generate real-time streaming data point
     * @param {Object} prevState - Previous state for continuity
     * @returns {Object} New data point
     */
    generateRealtimePoint(prevState = null) {
        const state = prevState || {
            bias: Utils.randBetween(0.3, 2.5),
            driftRate: Utils.randBetween(0.001, 0.05),
            time: 0
        };

        state.time += 1;
        const drift = state.bias + state.driftRate * state.time * 0.01;
        const noise = Utils.gaussRandom(0, 0.15);
        const periodic = 0.1 * Math.sin(2 * Math.PI * state.time / 200);

        return {
            value: drift + noise + periodic,
            state: state
        };
    }
};
