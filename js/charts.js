/* ============================================================
   SatSync AI — Chart Manager
   All Chart.js chart initialization and updates
   ============================================================ */

const Charts = {
    instances: {},

    /**
     * Destroy a chart if it exists
     */
    destroy(id) {
        if (this.instances[id]) {
            this.instances[id].destroy();
            delete this.instances[id];
        }
    },

    /* ============================================================
       DASHBOARD CHARTS
       ============================================================ */

    initRealtimeErrorChart() {
        this.destroy('realtime-error');
        const ctx = document.getElementById('realtime-error-chart');
        if (!ctx) return;
        const labels = Utils.generateHistLabels(60, 1);
        const data = [];
        let val = 2.0;
        for (let i = 0; i < 60; i++) {
            val += Utils.gaussRandom(0, 0.08);
            val = Utils.clamp(val, 0.5, 4.0);
            data.push(val);
        }
        const gradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 250);
        gradient.addColorStop(0, 'rgba(99, 102, 241, 0.3)');
        gradient.addColorStop(1, 'rgba(99, 102, 241, 0.01)');

        this.instances['realtime-error'] = new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    label: 'Clock Error (ns)',
                    data: data,
                    borderColor: '#6366f1',
                    backgroundColor: gradient,
                    fill: true,
                    tension: 0.4,
                    borderWidth: 2,
                    pointRadius: 0,
                    pointHitRadius: 10
                }]
            },
            options: {
                ...Utils.chartDefaults(),
                scales: {
                    ...Utils.chartDefaults().scales,
                    y: {
                        ...Utils.chartDefaults().scales.y,
                        title: { display: true, text: 'Error (ns)', color: '#64748b', font: { size: 11 } }
                    }
                }
            }
        });
    },

    initErrorDistributionChart() {
        this.destroy('error-distribution');
        const ctx = document.getElementById('error-distribution-chart');
        if (!ctx) return;

        // Generate histogram-like data
        const bins = ['0-0.5', '0.5-1', '1-1.5', '1.5-2', '2-2.5', '2.5-3', '3-3.5', '3.5-4', '>4'];
        const counts = [45, 82, 120, 95, 65, 38, 22, 12, 5];
        
        this.instances['error-distribution'] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: bins,
                datasets: [{
                    label: 'Frequency',
                    data: counts,
                    backgroundColor: counts.map((_, i) => {
                        const t = i / (bins.length - 1);
                        return `rgba(${Math.round(99 + (244 - 99) * t)}, ${Math.round(102 + (63 - 102) * t)}, ${Math.round(241 + (94 - 241) * t)}, 0.7)`;
                    }),
                    borderColor: counts.map((_, i) => {
                        const t = i / (bins.length - 1);
                        return `rgba(${Math.round(99 + (244 - 99) * t)}, ${Math.round(102 + (63 - 102) * t)}, ${Math.round(241 + (94 - 241) * t)}, 1)`;
                    }),
                    borderWidth: 1,
                    borderRadius: 4
                }]
            },
            options: {
                ...Utils.chartDefaults(),
                scales: {
                    ...Utils.chartDefaults().scales,
                    x: {
                        ...Utils.chartDefaults().scales.x,
                        title: { display: true, text: 'Error Range (ns)', color: '#64748b', font: { size: 11 } }
                    },
                    y: {
                        ...Utils.chartDefaults().scales.y,
                        title: { display: true, text: 'Count', color: '#64748b', font: { size: 11 } }
                    }
                }
            }
        });
    },

    updateRealtimeChart(newValue) {
        const chart = this.instances['realtime-error'];
        if (!chart) return;
        chart.data.labels.push(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }));
        chart.data.datasets[0].data.push(newValue);
        if (chart.data.labels.length > 60) {
            chart.data.labels.shift();
            chart.data.datasets[0].data.shift();
        }
        chart.update('none');
    },

    /* ============================================================
       SIMULATION CHART
       ============================================================ */

    initSimulationChart(simData) {
        this.destroy('simulation');
        const ctx = document.getElementById('simulation-chart');
        if (!ctx) return;

        const labels = simData.time.map(t => Utils.formatNum(t, 1) + 'h');
        
        // Find anomaly regions for annotation
        const anomalyPoints = simData.anomalyFlags
            .map((flag, i) => flag ? { x: i, y: simData.rawError[i] } : null)
            .filter(Boolean);

        this.instances['simulation'] = new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets: [
                    {
                        label: 'Raw Clock Error',
                        data: simData.rawError,
                        borderColor: '#6366f1',
                        backgroundColor: 'rgba(99, 102, 241, 0.05)',
                        fill: true,
                        tension: 0.3,
                        borderWidth: 1.5,
                        pointRadius: 0,
                        order: 2
                    },
                    {
                        label: 'Drift Component',
                        data: simData.driftComponent,
                        borderColor: '#06b6d4',
                        borderWidth: 2,
                        borderDash: [6, 3],
                        tension: 0.4,
                        pointRadius: 0,
                        fill: false,
                        order: 3
                    },
                    {
                        label: 'Anomaly',
                        data: simData.anomalyFlags.map((flag, i) => flag ? simData.rawError[i] : null),
                        borderColor: '#f43f5e',
                        backgroundColor: 'rgba(244, 63, 94, 0.3)',
                        fill: false,
                        tension: 0,
                        borderWidth: 3,
                        pointRadius: simData.anomalyFlags.map(f => f ? 4 : 0),
                        pointBackgroundColor: '#f43f5e',
                        spanGaps: false,
                        order: 1
                    }
                ]
            },
            options: {
                ...Utils.chartDefaults(),
                scales: {
                    ...Utils.chartDefaults().scales,
                    x: {
                        ...Utils.chartDefaults().scales.x,
                        title: { display: true, text: 'Time (hours)', color: '#64748b', font: { size: 11 } }
                    },
                    y: {
                        ...Utils.chartDefaults().scales.y,
                        title: { display: true, text: 'Clock Error (ns)', color: '#64748b', font: { size: 11 } }
                    }
                }
            }
        });
    },

    /* ============================================================
       PREDICTION CHART
       ============================================================ */

    initPredictionChart(predData) {
        this.destroy('prediction');
        const ctx = document.getElementById('prediction-chart');
        if (!ctx) return;

        const splitIdx = predData.splitIndex;
        
        // Historical data (before split)
        const historicalData = predData.historical.map((v, i) => i < splitIdx ? v : null);
        
        // Prediction data (after split, with one overlap point)
        const predictionData = new Array(splitIdx - 1).fill(null);
        predictionData.push(predData.historical[splitIdx - 1]); // overlap
        predictionData.push(...predData.predictions);

        // Confidence bands
        const upperData = new Array(splitIdx - 1).fill(null);
        upperData.push(predData.historical[splitIdx - 1]);
        upperData.push(...predData.upperBound);

        const lowerData = new Array(splitIdx - 1).fill(null);
        lowerData.push(predData.historical[splitIdx - 1]);
        lowerData.push(...predData.lowerBound);

        this.instances['prediction'] = new Chart(ctx, {
            type: 'line',
            data: {
                labels: predData.labels,
                datasets: [
                    {
                        label: 'Historical Data',
                        data: historicalData,
                        borderColor: '#6366f1',
                        backgroundColor: 'rgba(99, 102, 241, 0.05)',
                        fill: true,
                        tension: 0.3,
                        borderWidth: 1.5,
                        pointRadius: 0,
                        order: 2
                    },
                    {
                        label: 'AI Prediction',
                        data: predictionData,
                        borderColor: '#06b6d4',
                        borderWidth: 2,
                        tension: 0.3,
                        pointRadius: 0,
                        fill: false,
                        order: 1
                    },
                    {
                        label: '95% Upper',
                        data: upperData,
                        borderColor: 'rgba(6, 182, 212, 0.2)',
                        backgroundColor: 'rgba(6, 182, 212, 0.08)',
                        borderWidth: 1,
                        borderDash: [4, 4],
                        tension: 0.3,
                        pointRadius: 0,
                        fill: '+1',
                        order: 3
                    },
                    {
                        label: '95% Lower',
                        data: lowerData,
                        borderColor: 'rgba(6, 182, 212, 0.2)',
                        borderWidth: 1,
                        borderDash: [4, 4],
                        tension: 0.3,
                        pointRadius: 0,
                        fill: false,
                        order: 3
                    }
                ]
            },
            options: {
                ...Utils.chartDefaults(),
                plugins: {
                    ...Utils.chartDefaults().plugins,
                    annotation: {
                        annotations: {
                            splitLine: {
                                type: 'line',
                                xMin: splitIdx,
                                xMax: splitIdx,
                                borderColor: 'rgba(234, 179, 8, 0.5)',
                                borderWidth: 2,
                                borderDash: [6, 4],
                                label: {
                                    display: true,
                                    content: 'Now',
                                    position: 'start',
                                    backgroundColor: 'rgba(234, 179, 8, 0.15)',
                                    color: '#eab308',
                                    font: { size: 10, weight: '600' }
                                }
                            }
                        }
                    }
                },
                scales: {
                    ...Utils.chartDefaults().scales,
                    x: {
                        ...Utils.chartDefaults().scales.x,
                        title: { display: true, text: 'Time', color: '#64748b', font: { size: 11 } }
                    },
                    y: {
                        ...Utils.chartDefaults().scales.y,
                        title: { display: true, text: 'Clock Error (ns)', color: '#64748b', font: { size: 11 } }
                    }
                }
            }
        });
    },

    initModelComparisonChart(predictions) {
        this.destroy('model-comparison');
        const ctx = document.getElementById('model-comparison-chart');
        if (!ctx) return;

        const models = Object.values(Predictor.models);
        
        this.instances['model-comparison'] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: models.map(m => m.name),
                datasets: [
                    {
                        label: 'MAE (ns)',
                        data: models.map(m => m.mae),
                        backgroundColor: ['rgba(168, 85, 247, 0.6)', 'rgba(6, 182, 212, 0.6)', 'rgba(100, 116, 139, 0.6)', 'rgba(99, 102, 241, 0.6)'],
                        borderColor: ['#a855f7', '#06b6d4', '#64748b', '#6366f1'],
                        borderWidth: 1,
                        borderRadius: 6
                    }
                ]
            },
            options: {
                ...Utils.chartDefaults(),
                indexAxis: 'y',
                scales: {
                    x: {
                        ...Utils.chartDefaults().scales.x,
                        title: { display: true, text: 'MAE (ns)', color: '#64748b', font: { size: 11 } }
                    },
                    y: { ...Utils.chartDefaults().scales.y }
                }
            }
        });
    },

    /* ============================================================
       ANOMALY CHART
       ============================================================ */

    initAnomalyChart(data) {
        this.destroy('anomaly');
        const ctx = document.getElementById('anomaly-chart');
        if (!ctx) return;

        this.instances['anomaly'] = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels,
                datasets: [
                    {
                        label: 'Clock Error',
                        data: data.data,
                        borderColor: '#6366f1',
                        backgroundColor: 'rgba(99, 102, 241, 0.03)',
                        fill: true,
                        tension: 0.3,
                        borderWidth: 1.5,
                        pointRadius: 0,
                        order: 2
                    },
                    {
                        label: 'Anomaly Points',
                        data: data.anomalyMarkers,
                        borderColor: '#f43f5e',
                        backgroundColor: 'rgba(244, 63, 94, 0.5)',
                        pointRadius: data.anomalyMarkers.map(v => v !== null ? 5 : 0),
                        pointBackgroundColor: '#f43f5e',
                        showLine: false,
                        order: 1
                    },
                    {
                        label: 'Upper Threshold',
                        data: data.thresholdUpper,
                        borderColor: 'rgba(249, 115, 22, 0.4)',
                        borderWidth: 1,
                        borderDash: [6, 4],
                        pointRadius: 0,
                        fill: false,
                        order: 3
                    },
                    {
                        label: 'Lower Threshold',
                        data: data.thresholdLower,
                        borderColor: 'rgba(249, 115, 22, 0.4)',
                        borderWidth: 1,
                        borderDash: [6, 4],
                        pointRadius: 0,
                        fill: false,
                        order: 3
                    }
                ]
            },
            options: {
                ...Utils.chartDefaults(),
                scales: {
                    ...Utils.chartDefaults().scales,
                    y: {
                        ...Utils.chartDefaults().scales.y,
                        title: { display: true, text: 'Clock Error (ns)', color: '#64748b', font: { size: 11 } }
                    }
                }
            }
        });
    },

    /* ============================================================
       CORRECTION CHART
       ============================================================ */

    initCorrectionChart(data) {
        this.destroy('correction');
        const ctx = document.getElementById('correction-chart');
        if (!ctx) return;

        this.instances['correction'] = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels,
                datasets: [
                    {
                        label: 'Before Correction',
                        data: data.beforeData,
                        borderColor: '#f43f5e',
                        backgroundColor: 'rgba(244, 63, 94, 0.05)',
                        fill: true,
                        tension: 0.3,
                        borderWidth: 1.5,
                        pointRadius: 0,
                        order: 2
                    },
                    {
                        label: 'After Correction',
                        data: data.afterData,
                        borderColor: '#22c55e',
                        backgroundColor: 'rgba(34, 197, 94, 0.05)',
                        fill: true,
                        tension: 0.3,
                        borderWidth: 2,
                        pointRadius: 0,
                        order: 1
                    },
                    {
                        label: 'Tolerance Band +',
                        data: data.toleranceBand,
                        borderColor: 'rgba(99, 102, 241, 0.2)',
                        backgroundColor: 'rgba(99, 102, 241, 0.05)',
                        borderWidth: 1,
                        borderDash: [4, 4],
                        pointRadius: 0,
                        fill: '+1',
                        order: 3
                    },
                    {
                        label: 'Tolerance Band -',
                        data: data.toleranceBandNeg,
                        borderColor: 'rgba(99, 102, 241, 0.2)',
                        borderWidth: 1,
                        borderDash: [4, 4],
                        pointRadius: 0,
                        fill: false,
                        order: 3
                    }
                ]
            },
            options: {
                ...Utils.chartDefaults(),
                scales: {
                    ...Utils.chartDefaults().scales,
                    y: {
                        ...Utils.chartDefaults().scales.y,
                        title: { display: true, text: 'Clock Error (ns)', color: '#64748b', font: { size: 11 } }
                    }
                }
            }
        });
    },

    /* ============================================================
       TELEMETRY CHARTS
       ============================================================ */

    initTelemetryCharts() {
        const configs = [
            { id: 'tel-bias', canvasId: 'tel-bias-chart', label: 'Clock Bias', color: '#6366f1', unit: 'ns' },
            { id: 'tel-drift', canvasId: 'tel-drift-chart', label: 'Freq Drift', color: '#06b6d4', unit: 'ns/s' },
            { id: 'tel-signal', canvasId: 'tel-signal-chart', label: 'Signal', color: '#22c55e', unit: 'dBHz' },
            { id: 'tel-temp', canvasId: 'tel-temp-chart', label: 'Temperature', color: '#f97316', unit: '°C' }
        ];

        const labels = Array(Telemetry.maxBufferSize).fill('');

        configs.forEach(cfg => {
            this.destroy(cfg.id);
            const ctx = document.getElementById(cfg.canvasId);
            if (!ctx) return;

            const bufferKey = cfg.id.replace('tel-', '');
            const dataKey = bufferKey === 'signal' ? 'signal' : bufferKey === 'temp' ? 'temperature' : bufferKey;
            
            const gradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 200);
            gradient.addColorStop(0, cfg.color + '30');
            gradient.addColorStop(1, cfg.color + '02');

            this.instances[cfg.id] = new Chart(ctx, {
                type: 'line',
                data: {
                    labels,
                    datasets: [{
                        label: cfg.label,
                        data: Telemetry.dataBuffer[dataKey] || [],
                        borderColor: cfg.color,
                        backgroundColor: gradient,
                        fill: true,
                        tension: 0.4,
                        borderWidth: 1.5,
                        pointRadius: 0
                    }]
                },
                options: {
                    ...Utils.chartDefaults(),
                    animation: { duration: 0 },
                    scales: {
                        x: { display: false },
                        y: {
                            ...Utils.chartDefaults().scales.y,
                            title: { display: true, text: cfg.unit, color: '#64748b', font: { size: 10 } }
                        }
                    }
                }
            });
        });
    },

    updateTelemetryCharts() {
        const mapping = {
            'tel-bias': 'bias',
            'tel-drift': 'drift',
            'tel-signal': 'signal',
            'tel-temp': 'temperature'
        };

        Object.entries(mapping).forEach(([chartId, dataKey]) => {
            const chart = this.instances[chartId];
            if (!chart) return;
            chart.data.datasets[0].data = [...Telemetry.dataBuffer[dataKey]];
            chart.update('none');
        });
    },

    /* ============================================================
       CONSTELLATION CHARTS
       ============================================================ */

    initSISREChart() {
        this.destroy('sisre');
        const ctx = document.getElementById('sisre-chart');
        if (!ctx) return;

        this.instances['sisre'] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['GPS', 'Galileo', 'BeiDou-3', 'GLONASS', 'NavIC'],
                datasets: [{
                    label: 'SISRE (cm)',
                    data: [30, 32, 5, 55, null],
                    backgroundColor: [
                        'rgba(99, 102, 241, 0.6)',
                        'rgba(59, 130, 246, 0.6)',
                        'rgba(249, 115, 22, 0.6)',
                        'rgba(244, 63, 94, 0.6)',
                        'rgba(100, 116, 139, 0.3)'
                    ],
                    borderColor: ['#6366f1', '#3b82f6', '#f97316', '#f43f5e', '#64748b'],
                    borderWidth: 1,
                    borderRadius: 8
                }]
            },
            options: {
                ...Utils.chartDefaults(),
                scales: {
                    ...Utils.chartDefaults().scales,
                    y: {
                        ...Utils.chartDefaults().scales.y,
                        title: { display: true, text: 'SISRE (cm)', color: '#64748b', font: { size: 11 } }
                    }
                }
            }
        });
    },

    initStabilityChart() {
        this.destroy('stability');
        const ctx = document.getElementById('stability-chart');
        if (!ctx) return;

        this.instances['stability'] = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: ['Short-term', 'Long-term', 'Noise Floor', 'Drift Rate', 'Temperature Sensitivity'],
                datasets: [
                    {
                        label: 'Rubidium',
                        data: [85, 70, 75, 72, 68],
                        borderColor: '#6366f1',
                        backgroundColor: 'rgba(99, 102, 241, 0.1)',
                        borderWidth: 2,
                        pointBackgroundColor: '#6366f1'
                    },
                    {
                        label: 'Cesium',
                        data: [65, 90, 80, 85, 75],
                        borderColor: '#22c55e',
                        backgroundColor: 'rgba(34, 197, 94, 0.1)',
                        borderWidth: 2,
                        pointBackgroundColor: '#22c55e'
                    },
                    {
                        label: 'Hydrogen Maser',
                        data: [95, 92, 90, 88, 82],
                        borderColor: '#a855f7',
                        backgroundColor: 'rgba(168, 85, 247, 0.1)',
                        borderWidth: 2,
                        pointBackgroundColor: '#a855f7'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { 
                        display: true, 
                        position: 'bottom',
                        labels: { color: '#94a3b8', font: { size: 11 }, usePointStyle: true }
                    }
                },
                scales: {
                    r: {
                        grid: { color: 'rgba(99, 102, 241, 0.08)' },
                        angleLines: { color: 'rgba(99, 102, 241, 0.08)' },
                        pointLabels: { color: '#94a3b8', font: { size: 10 } },
                        ticks: { display: false },
                        suggestedMin: 0,
                        suggestedMax: 100
                    }
                }
            }
        });
    },

    /* ============================================================
       ANALYTICS CHARTS
       ============================================================ */

    initAnalyticsCharts() {
        // Error Reduction Over Time
        this.destroy('analytics-reduction');
        const ctx1 = document.getElementById('analytics-reduction-chart');
        if (ctx1) {
            const labels = ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6', 'Week 7', 'Week 8'];
            this.instances['analytics-reduction'] = new Chart(ctx1, {
                type: 'line',
                data: {
                    labels,
                    datasets: [
                        {
                            label: 'With AI Correction',
                            data: [2.0, 1.5, 0.9, 0.6, 0.4, 0.25, 0.18, 0.15],
                            borderColor: '#22c55e',
                            backgroundColor: 'rgba(34, 197, 94, 0.08)',
                            fill: true,
                            tension: 0.4,
                            borderWidth: 2,
                            pointRadius: 4,
                            pointBackgroundColor: '#22c55e'
                        },
                        {
                            label: 'Without Correction',
                            data: [2.0, 2.3, 2.7, 3.1, 3.4, 3.8, 4.1, 4.5],
                            borderColor: '#f43f5e',
                            backgroundColor: 'rgba(244, 63, 94, 0.08)',
                            fill: true,
                            tension: 0.4,
                            borderWidth: 2,
                            pointRadius: 4,
                            pointBackgroundColor: '#f43f5e'
                        }
                    ]
                },
                options: {
                    ...Utils.chartDefaults(),
                    plugins: {
                        ...Utils.chartDefaults().plugins,
                        legend: { display: true, position: 'top', labels: { color: '#94a3b8', usePointStyle: true, font: { size: 11 } } }
                    },
                    scales: {
                        ...Utils.chartDefaults().scales,
                        y: { ...Utils.chartDefaults().scales.y, title: { display: true, text: 'Avg Error (ns)', color: '#64748b', font: { size: 11 } } }
                    }
                }
            });
        }

        // Error Source Breakdown (Doughnut)
        this.destroy('error-source');
        const ctx2 = document.getElementById('error-source-chart');
        if (ctx2) {
            this.instances['error-source'] = new Chart(ctx2, {
                type: 'doughnut',
                data: {
                    labels: ['Ionospheric', 'Orbital', 'Clock Error', 'Multipath', 'Tropospheric', 'Receiver Noise'],
                    datasets: [{
                        data: [5.0, 2.5, 2.0, 1.0, 0.5, 0.3],
                        backgroundColor: [
                            'rgba(244, 63, 94, 0.7)',
                            'rgba(249, 115, 22, 0.7)',
                            'rgba(99, 102, 241, 0.7)',
                            'rgba(234, 179, 8, 0.7)',
                            'rgba(34, 197, 94, 0.7)',
                            'rgba(6, 182, 212, 0.7)'
                        ],
                        borderColor: 'rgba(10, 14, 26, 0.8)',
                        borderWidth: 3,
                        hoverOffset: 8
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '60%',
                    plugins: {
                        legend: {
                            display: true,
                            position: 'bottom',
                            labels: { color: '#94a3b8', font: { size: 10 }, usePointStyle: true, padding: 12 }
                        },
                        tooltip: Utils.chartDefaults().plugins.tooltip
                    }
                }
            });
        }

        // Industry Impact (Horizontal Bar)
        this.destroy('industry-impact');
        const ctx3 = document.getElementById('industry-impact-chart');
        if (ctx3) {
            this.instances['industry-impact'] = new Chart(ctx3, {
                type: 'bar',
                data: {
                    labels: ['Aviation', 'Autonomous Vehicles', 'Financial Markets', 'Power Grid', 'Telecom', 'Agriculture', 'Maritime'],
                    datasets: [{
                        label: 'Impact Severity',
                        data: [95, 92, 90, 88, 82, 78, 75],
                        backgroundColor: [
                            'rgba(244, 63, 94, 0.6)',
                            'rgba(244, 63, 94, 0.5)',
                            'rgba(249, 115, 22, 0.6)',
                            'rgba(249, 115, 22, 0.5)',
                            'rgba(234, 179, 8, 0.5)',
                            'rgba(99, 102, 241, 0.5)',
                            'rgba(99, 102, 241, 0.4)'
                        ],
                        borderRadius: 6,
                        borderWidth: 0
                    }]
                },
                options: {
                    ...Utils.chartDefaults(),
                    indexAxis: 'y',
                    scales: {
                        x: { ...Utils.chartDefaults().scales.x, max: 100, title: { display: true, text: 'Severity Score', color: '#64748b', font: { size: 11 } } },
                        y: { ...Utils.chartDefaults().scales.y }
                    }
                }
            });
        }

        // Performance Metrics (Multi-line)
        this.destroy('performance');
        const ctx4 = document.getElementById('performance-chart');
        if (ctx4) {
            const days = Array.from({ length: 30 }, (_, i) => `Day ${i + 1}`);
            this.instances['performance'] = new Chart(ctx4, {
                type: 'line',
                data: {
                    labels: days,
                    datasets: [
                        {
                            label: 'Prediction Accuracy (%)',
                            data: days.map((_, i) => 88 + Math.random() * 8 + i * 0.15),
                            borderColor: '#6366f1',
                            borderWidth: 2,
                            tension: 0.4,
                            pointRadius: 0,
                            yAxisID: 'y'
                        },
                        {
                            label: 'Corrections/Day',
                            data: days.map((_, i) => 120 + Math.random() * 40 + i * 2),
                            borderColor: '#22c55e',
                            borderWidth: 2,
                            tension: 0.4,
                            pointRadius: 0,
                            yAxisID: 'y1'
                        }
                    ]
                },
                options: {
                    ...Utils.chartDefaults(),
                    plugins: {
                        ...Utils.chartDefaults().plugins,
                        legend: { display: true, position: 'top', labels: { color: '#94a3b8', usePointStyle: true, font: { size: 11 } } }
                    },
                    scales: {
                        x: Utils.chartDefaults().scales.x,
                        y: {
                            ...Utils.chartDefaults().scales.y,
                            position: 'left',
                            title: { display: true, text: 'Accuracy (%)', color: '#6366f1', font: { size: 11 } }
                        },
                        y1: {
                            ...Utils.chartDefaults().scales.y,
                            position: 'right',
                            grid: { display: false },
                            title: { display: true, text: 'Corrections', color: '#22c55e', font: { size: 11 } }
                        }
                    }
                }
            });
        }
    }
};
