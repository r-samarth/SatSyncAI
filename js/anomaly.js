/* ============================================================
   SatSync AI — Anomaly Detection Engine
   Detects drift, noise spikes, and clock anomalies
   ============================================================ */

const AnomalyDetector = {
    // Detection thresholds
    thresholds: {
        driftRate: 0.1,      // ns/s — max acceptable drift rate
        noiseSpike: 3.0,     // standard deviations for spike detection
        jumpThreshold: 2.0,  // ns — sudden jump threshold
        gradualDrift: 5.0    // ns — gradual drift accumulation threshold
    },

    // Pre-generated anomaly events for demo
    anomalyEvents: [
        {
            id: 'ANM-001',
            type: 'critical',
            title: 'Clock Phase Jump Detected — GPS IIF-12',
            description: 'Sudden 4.7 ns phase discontinuity at 13:42 UTC. Possible thermal shock from eclipse exit.',
            satellite: 'GPS-IIF-12',
            magnitude: '4.7 ns',
            timestamp: '2026-09-05 13:42:18 UTC',
            status: 'active',
            responseTime: '18ms'
        },
        {
            id: 'ANM-002',
            type: 'critical',
            title: 'Excessive Frequency Drift — NavIC IRNSS-1B',
            description: 'Rubidium clock showing 0.15 ns/s drift rate, exceeding 0.1 ns/s threshold. Clock aging suspected.',
            satellite: 'IRNSS-1B',
            magnitude: '0.15 ns/s',
            timestamp: '2026-09-05 12:15:33 UTC',
            status: 'active',
            responseTime: '12ms'
        },
        {
            id: 'ANM-003',
            type: 'warning',
            title: 'Noise Level Elevation — Galileo FOC-07',
            description: 'Stochastic noise increased to 3.2σ above baseline. Monitoring for sustained anomaly.',
            satellite: 'GAL-FOC-07',
            magnitude: '3.2σ',
            timestamp: '2026-09-05 11:28:05 UTC',
            status: 'monitoring',
            responseTime: '25ms'
        },
        {
            id: 'ANM-004',
            type: 'resolved',
            title: 'Periodic Variation Anomaly — GPS IIR-01',
            description: 'Abnormal periodic component detected during eclipse season. Auto-corrected via thermal model update.',
            satellite: 'GPS-IIR-01',
            magnitude: '1.8 ns',
            timestamp: '2026-09-05 09:55:12 UTC',
            status: 'resolved',
            responseTime: '31ms'
        },
        {
            id: 'ANM-005',
            type: 'resolved',
            title: 'Gradual Drift Accumulation — BeiDou-3 MEO-15',
            description: 'Accumulated drift of 4.2 ns over 12 hours. Correction polynomial updated.',
            satellite: 'BDS3-MEO-15',
            magnitude: '4.2 ns',
            timestamp: '2026-09-05 08:30:00 UTC',
            status: 'resolved',
            responseTime: '22ms'
        },
        {
            id: 'ANM-006',
            type: 'resolved',
            title: 'Inter-Satellite Timing Discrepancy — GLONASS-M',
            description: 'GLONASS-M 742 clock offset from constellation mean exceeded 5 ns. Navigation message updated.',
            satellite: 'GLO-M-742',
            magnitude: '5.1 ns',
            timestamp: '2026-09-05 07:12:44 UTC',
            status: 'resolved',
            responseTime: '28ms'
        },
        {
            id: 'ANM-007',
            type: 'resolved',
            title: 'Short-Term Stability Degradation — GPS III-04',
            description: 'Allan deviation at τ=100s degraded by 40%. Returned to nominal after ground upload.',
            satellite: 'GPS-III-04',
            magnitude: '40% degradation',
            timestamp: '2026-09-05 05:48:20 UTC',
            status: 'resolved',
            responseTime: '19ms'
        }
    ],

    /**
     * Generate anomaly detection timeline data
     * @param {number} samples - Number of data points
     * @returns {Object} Data with anomaly markers
     */
    generateAnomalyTimeline(samples = 200) {
        const data = [];
        const anomalyMarkers = [];
        const thresholdUpper = [];
        const thresholdLower = [];
        const labels = Utils.generateHistLabels(samples, 3);

        let baseline = Utils.randBetween(1.0, 2.5);
        const threshold = 3.0;

        for (let i = 0; i < samples; i++) {
            const t = i / samples;
            let value = baseline + Utils.gaussRandom(0, 0.3);
            value += 0.2 * Math.sin(2 * Math.PI * t * 3);
            
            // Inject anomalies at specific points
            let isAnomaly = false;
            
            // First anomaly cluster
            if (i >= 50 && i <= 60) {
                value += 4 * Math.exp(-0.5 * Math.pow((i - 55) / 3, 2));
                isAnomaly = i >= 52 && i <= 58;
            }
            
            // Second anomaly - gradual drift
            if (i >= 110 && i <= 135) {
                value += 0.15 * (i - 110);
                isAnomaly = i >= 120;
            }
            
            // Third anomaly - sharp spike
            if (i >= 165 && i <= 170) {
                value += 5 * (i === 167 || i === 168 ? 1 : 0.3);
                isAnomaly = true;
            }

            data.push(value);
            anomalyMarkers.push(isAnomaly ? value : null);
            thresholdUpper.push(baseline + threshold);
            thresholdLower.push(baseline - threshold);
        }

        return {
            labels,
            data,
            anomalyMarkers,
            thresholdUpper,
            thresholdLower
        };
    },

    /**
     * Get active anomaly count
     */
    getActiveCount() {
        return this.anomalyEvents.filter(e => e.status === 'active').length;
    },

    /**
     * Get resolved count
     */
    getResolvedCount() {
        return this.anomalyEvents.filter(e => e.status === 'resolved').length;
    },

    /**
     * Get average response time
     */
    getAvgResponseTime() {
        const times = this.anomalyEvents.map(e => parseInt(e.responseTime));
        return Math.round(times.reduce((a, b) => a + b, 0) / times.length) + 'ms';
    }
};
