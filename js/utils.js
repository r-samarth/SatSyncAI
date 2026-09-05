/* ============================================================
   SatSync AI — Utility Functions
   ============================================================ */

const Utils = {
    // Generate Gaussian random number (Box-Muller transform)
    gaussRandom(mean = 0, stddev = 1) {
        let u = 0, v = 0;
        while (u === 0) u = Math.random();
        while (v === 0) v = Math.random();
        const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
        return z * stddev + mean;
    },

    // Format number with fixed decimals
    formatNum(num, decimals = 2) {
        return Number(num).toFixed(decimals);
    },

    // Format large number with commas
    formatComma(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    },

    // Get current UTC time string
    getUTCTime() {
        const now = new Date();
        return now.toUTCString().split(' ')[4] + ' UTC';
    },

    // Generate time labels
    generateTimeLabels(count, intervalMinutes = 1, startOffset = 0) {
        const labels = [];
        const now = new Date();
        now.setMinutes(now.getMinutes() - startOffset);
        for (let i = 0; i < count; i++) {
            const t = new Date(now.getTime() + i * intervalMinutes * 60000);
            labels.push(t.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }));
        }
        return labels;
    },

    // Generate historical time labels going backward
    generateHistLabels(count, intervalMinutes = 5) {
        const labels = [];
        const now = new Date();
        for (let i = count - 1; i >= 0; i--) {
            const t = new Date(now.getTime() - i * intervalMinutes * 60000);
            labels.push(t.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }));
        }
        return labels;
    },

    // Smooth data with moving average
    movingAverage(data, windowSize = 5) {
        const result = [];
        for (let i = 0; i < data.length; i++) {
            const start = Math.max(0, i - Math.floor(windowSize / 2));
            const end = Math.min(data.length, i + Math.floor(windowSize / 2) + 1);
            const slice = data.slice(start, end);
            result.push(slice.reduce((a, b) => a + b, 0) / slice.length);
        }
        return result;
    },

    // Random between min and max
    randBetween(min, max) {
        return Math.random() * (max - min) + min;
    },

    // Random integer
    randInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },

    // Clamp value
    clamp(val, min, max) {
        return Math.max(min, Math.min(max, val));
    },

    // Delay
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    // Animate counter
    animateCounter(element, target, duration = 1000, suffix = '') {
        const start = parseFloat(element.textContent) || 0;
        const startTime = performance.now();
        
        function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = start + (target - start) * eased;
            element.textContent = Utils.formatNum(current, 2) + suffix;
            if (progress < 1) requestAnimationFrame(update);
        }
        requestAnimationFrame(update);
    },

    // Chart default options
    chartDefaults() {
        return {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(20, 25, 41, 0.95)',
                    titleColor: '#e2e8f0',
                    bodyColor: '#94a3b8',
                    borderColor: 'rgba(99, 102, 241, 0.2)',
                    borderWidth: 1,
                    cornerRadius: 8,
                    padding: 12,
                    titleFont: { family: 'Inter', weight: '600' },
                    bodyFont: { family: 'JetBrains Mono', size: 12 }
                }
            },
            scales: {
                x: {
                    grid: { color: 'rgba(99, 102, 241, 0.06)', drawBorder: false },
                    ticks: { color: '#64748b', font: { family: 'JetBrains Mono', size: 10 }, maxTicksLimit: 10 },
                    border: { display: false }
                },
                y: {
                    grid: { color: 'rgba(99, 102, 241, 0.06)', drawBorder: false },
                    ticks: { color: '#64748b', font: { family: 'JetBrains Mono', size: 10 } },
                    border: { display: false }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            },
            animation: {
                duration: 800,
                easing: 'easeOutCubic'
            }
        };
    },

    // Generate gradient for Chart.js
    createGradient(ctx, color1, color2, height = 300) {
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, color1);
        gradient.addColorStop(1, color2);
        return gradient;
    },

    // Satellite names
    satellites: [
        { id: 'GPS-IIR-01', name: 'GPS IIR-01', prn: 'PRN 01', constellation: 'GPS', clockType: 'Rubidium' },
        { id: 'GPS-IIF-12', name: 'GPS IIF-12', prn: 'PRN 12', constellation: 'GPS', clockType: 'Rubidium' },
        { id: 'GPS-III-04', name: 'GPS III-04', prn: 'PRN 04', constellation: 'GPS', clockType: 'Rubidium' },
        { id: 'GAL-FOC-07', name: 'Galileo FOC-07', prn: 'E07', constellation: 'Galileo', clockType: 'PHM' },
        { id: 'GAL-FOC-12', name: 'Galileo FOC-12', prn: 'E12', constellation: 'Galileo', clockType: 'PHM' },
        { id: 'BDS3-MEO-15', name: 'BeiDou-3 MEO-15', prn: 'C15', constellation: 'BeiDou', clockType: 'PHM' },
        { id: 'GLO-M-742', name: 'GLONASS-M 742', prn: 'R07', constellation: 'GLONASS', clockType: 'Cesium' },
        { id: 'IRNSS-1B', name: 'NavIC IRNSS-1B', prn: 'I02', constellation: 'NavIC', clockType: 'Rubidium' },
    ],

    // Get random satellite
    randomSat() {
        return this.satellites[this.randInt(0, this.satellites.length - 1)];
    }
};
