/* ============================================================
   SatSync AI — Correction Engine
   AI-Augmented Kalman Filter correction system
   ============================================================ */

const CorrectionEngine = {
    // Correction methods and their accuracies
    methods: {
        'ai-kalman': {
            name: 'AI-Augmented Kalman Filter',
            accuracy: 0.05,
            reductionPct: 86,
            description: 'Neural network predicts residuals + Kalman filter tracks state'
        },
        'ppp': {
            name: 'Precise Point Positioning',
            accuracy: 0.1,
            reductionPct: 72,
            description: 'Uses IGS precise orbit & clock products'
        },
        'dgps': {
            name: 'Differential GNSS',
            accuracy: 1.0,
            reductionPct: 55,
            description: 'Base station provides differential corrections'
        },
        'broadcast': {
            name: 'Broadcast Clock Corrections',
            accuracy: 5.0,
            reductionPct: 30,
            description: 'Standard navigation message polynomial corrections'
        }
    },

    /**
     * Generate correction visualization data
     * @param {string} method - Correction method key
     * @param {string} satellite - Target satellite
     * @returns {Object} Before/after data with correction applied
     */
    generateCorrectionData(method = 'ai-kalman', satellite = 'GPS-IIR-01') {
        const methodInfo = this.methods[method];
        const samples = 200;
        const labels = Utils.generateHistLabels(samples, 3);

        const beforeData = [];
        const afterData = [];
        const toleranceBand = [];

        // Satellite-specific base error
        const baseErrors = {
            'GPS-IIR-01': { base: 2.5, drift: 0.008 },
            'GPS-IIF-12': { base: 1.8, drift: 0.006 },
            'GAL-FOC-07': { base: 1.2, drift: 0.004 },
            'IRNSS-1B': { base: 4.5, drift: 0.015 }
        };
        const satError = baseErrors[satellite] || baseErrors['GPS-IIR-01'];

        let maxBefore = 0;
        let maxAfter = 0;

        for (let i = 0; i < samples; i++) {
            const t = i / 30;
            
            // Before correction - original error signal
            let before = satError.base + satError.drift * t;
            before += Utils.gaussRandom(0, 0.4);
            before += 0.5 * Math.sin(2 * Math.PI * t / 3);
            
            // Add occasional spikes
            if (i === 45 || i === 130) before += Utils.randBetween(2, 4);
            if (i >= 80 && i <= 95) before += 0.1 * (i - 80);

            beforeData.push(before);
            maxBefore = Math.max(maxBefore, Math.abs(before));

            // After correction - reduced based on method accuracy
            const reductionFactor = methodInfo.reductionPct / 100;
            let after = before * (1 - reductionFactor);
            after += Utils.gaussRandom(0, methodInfo.accuracy * 0.3);
            afterData.push(after);
            maxAfter = Math.max(maxAfter, Math.abs(after));

            // Tolerance band (2 ns for standard, tighter for better methods)
            const tolerance = method === 'ai-kalman' ? 0.5 : method === 'ppp' ? 1.0 : 2.0;
            toleranceBand.push(tolerance);
        }

        // Compute stats
        const avgBefore = beforeData.reduce((a, b) => a + Math.abs(b), 0) / samples;
        const avgAfter = afterData.reduce((a, b) => a + Math.abs(b), 0) / samples;
        const posImprovement = {
            before: Utils.formatNum(avgBefore * 0.3, 2),
            after: Utils.formatNum(avgAfter * 0.3, 2)
        };

        return {
            labels,
            beforeData,
            afterData,
            toleranceBand: toleranceBand.map(v => v),
            toleranceBandNeg: toleranceBand.map(v => -v),
            stats: {
                beforeError: Utils.formatNum(avgBefore, 2) + ' ns',
                afterError: Utils.formatNum(avgAfter, 2) + ' ns',
                reductionPct: methodInfo.reductionPct,
                posImprovement: `${posImprovement.before} m → ${posImprovement.after} m`,
                method: methodInfo.name
            }
        };
    }
};
