/* ============================================================
   SatSync AI — Master Application Controller
   AI-Based Satellite Clock Error Prediction & Real-Time Correction
   SIH 2026 | Space Technology | Team Error 404
   ============================================================ */

const App = {
    // Current application state
    state: {
        currentPage: 'dashboard',
        telemetryRunning: true,
        selectedSat: 'GPS-IIR-01',
        selectedHorizon: 3,
        selectedModel: 'lstm',
        selectedCorrectionMethod: 'ai-kalman',
        simData: null,
        predData: null,
        anomalyFilter: 'all',
        anomalyMode: 'ai',
        unreadNotifications: 3,
        demo: {
            isOpen: false,
            currentStep: 1,
            totalSteps: 5,
            timerSeconds: 120,
            intervalId: null,
            autoPlaying: false
        }
    },

    // Sample notifications
    notifications: [
        {
            id: 'NOTIF-01',
            title: 'Critical Phase Jump Detected',
            desc: 'GPS IIF-12 exhibited 4.7 ns phase discontinuity during eclipse exit.',
            time: '2 mins ago',
            type: 'alert',
            unread: true,
            targetPage: 'anomaly'
        },
        {
            id: 'NOTIF-02',
            title: 'NavIC IRNSS-1B Clock Aging Flag',
            desc: 'Rubidium clock drift rate exceeded 0.10 ns/s threshold. Autonomous steering engaged.',
            time: '14 mins ago',
            type: 'alert',
            unread: true,
            targetPage: 'anomaly'
        },
        {
            id: 'NOTIF-03',
            title: 'OBC Closed-Loop Steering Success',
            desc: 'Cobham LEON4 completed phase rate adjustment in 11.8ms (<50ms target).',
            time: '35 mins ago',
            type: 'unread',
            unread: true,
            targetPage: 'architecture'
        },
        {
            id: 'NOTIF-04',
            title: 'IGS MGEX Multi-Constellation Sync',
            desc: '5M+ epoch benchmark archive validated against 0.075 ns ground truth.',
            time: '1 hour ago',
            type: 'standard',
            unread: false,
            targetPage: 'analytics'
        }
    ],

    /* ============================================================
       INIT & BOOTSTRAP
       ============================================================ */
    init() {
        // 1. Dismiss Loading Screen
        setTimeout(() => {
            const loader = document.getElementById('loading-screen');
            const appEl = document.getElementById('app');
            if (loader) loader.classList.add('fade-out');
            if (appEl) appEl.classList.remove('hidden');
            setTimeout(() => {
                if (loader) loader.style.display = 'none';
            }, 600);
        }, 800);

        // 2. Setup Global Listeners & Clocks
        this.setupClockTicker();
        this.setupNavigation();
        this.setupSidebarToggle();
        this.setupNotificationCenter();

        // 3. Initialize Specific Page Controllers
        this.initDashboard();
        this.initSimulation();
        this.initPrediction();
        this.initAnomaly();
        this.initCorrection();
        this.initTelemetry();
        this.initConstellations();
        this.initAnalytics();
        this.initArchitecture();
        this.initRisks();
        this.initLiveDemo();

        // 4. Start background telemetry streaming
        Telemetry.start((dp) => this.onTelemetryTick(dp), 1000);
    },

    /* ============================================================
       LIVE UTC CLOCK TICKER
       ============================================================ */
    setupClockTicker() {
        const liveTimeEl = document.getElementById('live-time');
        const updateClock = () => {
            const now = new Date();
            const utcString = now.toUTCString().split(' ')[4] + ' UTC';
            if (liveTimeEl) liveTimeEl.textContent = utcString;
        };
        updateClock();
        setInterval(updateClock, 1000);
    },

    /* ============================================================
       NAVIGATION ROUTING
       ============================================================ */
    setupNavigation() {
        const navItems = document.querySelectorAll('.nav-item');
        const pageTitles = {
            'dashboard': { title: 'Mission Control Dashboard', subtitle: 'Real-time satellite clock monitoring & AI predictions' },
            'simulation': { title: 'Physics-Based Clock Simulator', subtitle: 'Simulate satellite atomic clock drift, noise & relativistic dilation' },
            'prediction': { title: 'AI Clock Bias Prediction', subtitle: 'Deep Bi-LSTM residual forecasting with 95% confidence bounds' },
            'anomaly': { title: 'Proactive Anomaly Detection', subtitle: '3σ Chi-Square innovation gate & real-time failover monitoring' },
            'correction': { title: 'OBC Closed-Loop Correction Engine', subtitle: 'Sub-50ms onboard phase rate adjustment & positioning recovery' },
            'telemetry': { title: 'Live Spacecraft Telemetry Feed', subtitle: 'Continuous 1 Hz Rubidium & USO clock phase and environmental stream' },
            'constellation': { title: 'Multi-Constellation Global Health', subtitle: 'SISRE, atomic clock technologies & historical mission incidents' },
            'architecture': { title: 'Spaceborne Flight Architecture', subtitle: 'Edge compute budget, 6-stage autonomous pipeline & relativistic physics' },
            'risks': { title: 'Real-World Feasibility & Risk Safeguards', subtitle: 'Space-grade hardware tolerance, TMR memory voting & fault injection sandbox' },
            'analytics': { title: 'National Impact & Performance Analytics', subtitle: 'Socio-economic value, IGS MGEX benchmarks & error budgets' }
        };

        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const pageId = item.getAttribute('data-page');
                if (!pageId) return;
                this.navigateTo(pageId);
            });
        });

        // Check URL hash on initial load
        const hash = window.location.hash.replace('#', '');
        if (hash && document.getElementById(`page-${hash}`)) {
            this.navigateTo(hash);
        }
    },

    navigateTo(pageId) {
        // Update state
        this.state.currentPage = pageId;

        // Update Nav Item Active Classes
        document.querySelectorAll('.nav-item').forEach(item => {
            if (item.getAttribute('data-page') === pageId) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });

        // Switch Active Page Element
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });
        const targetPage = document.getElementById(`page-${pageId}`);
        if (targetPage) {
            targetPage.classList.add('active');
        }

        // Close sidebar on mobile
        const sidebar = document.getElementById('sidebar');
        if (sidebar && sidebar.classList.contains('mobile-open')) {
            sidebar.classList.remove('mobile-open');
        }

        // Update Header Titles
        const pageTitles = {
            'dashboard': { title: 'Mission Control Dashboard', subtitle: 'Real-time satellite clock monitoring & AI predictions' },
            'simulation': { title: 'Physics-Based Clock Simulator', subtitle: 'Simulate satellite atomic clock drift, noise & relativistic dilation' },
            'prediction': { title: 'AI Clock Bias Prediction', subtitle: 'Deep Bi-LSTM residual forecasting with 95% confidence bounds' },
            'anomaly': { title: 'Proactive Anomaly Detection', subtitle: '3σ Chi-Square innovation gate & real-time failover monitoring' },
            'correction': { title: 'OBC Closed-Loop Correction Engine', subtitle: 'Sub-50ms onboard phase rate adjustment & positioning recovery' },
            'telemetry': { title: 'Live Spacecraft Telemetry Feed', subtitle: 'Continuous 1 Hz Rubidium & USO clock phase and environmental stream' },
            'constellation': { title: 'Multi-Constellation Global Health', subtitle: 'SISRE, atomic clock technologies & historical mission incidents' },
            'architecture': { title: 'Spaceborne Flight Architecture', subtitle: 'Edge compute budget, 6-stage autonomous pipeline & relativistic physics' },
            'risks': { title: 'Real-World Feasibility & Risk Safeguards', subtitle: 'Space-grade hardware tolerance, TMR memory voting & fault injection sandbox' },
            'analytics': { title: 'National Impact & Performance Analytics', subtitle: 'Socio-economic value, IGS MGEX benchmarks & error budgets' }
        };

        const pageTitleEl = document.getElementById('page-title');
        const pageSubEl = document.getElementById('page-subtitle');
        if (pageTitles[pageId]) {
            if (pageTitleEl) pageTitleEl.textContent = pageTitles[pageId].title;
            if (pageSubEl) pageSubEl.textContent = pageTitles[pageId].subtitle;
        }

        // Trigger page-specific chart renderings
        this.onPageOpened(pageId);
    },

    onPageOpened(pageId) {
        setTimeout(() => {
            switch(pageId) {
                case 'dashboard':
                    Charts.initRealtimeErrorChart();
                    Charts.initErrorDistributionChart();
                    break;
                case 'simulation':
                    if (this.state.simData) {
                        Charts.initSimulationChart(this.state.simData);
                    } else {
                        // Generate initial simulation
                        const simBtn = document.getElementById('run-simulation');
                        if (simBtn) simBtn.click();
                    }
                    break;
                case 'prediction':
                    if (!this.state.predData) {
                        const predBtn = document.getElementById('run-prediction');
                        if (predBtn) predBtn.click();
                    } else {
                        Charts.initPredictionChart(this.state.predData);
                        Charts.initModelComparisonChart();
                    }
                    break;
                case 'anomaly':
                    const anmData = AnomalyDetector.generateAnomalyTimeline();
                    Charts.initAnomalyChart(anmData);
                    this.renderAnomalyLog();
                    break;
                case 'correction':
                    this.applyCorrectionAction();
                    break;
                case 'telemetry':
                    Charts.initTelemetryCharts();
                    break;
                case 'constellation':
                    Charts.initSISREChart();
                    Charts.initStabilityChart();
                    break;
                case 'analytics':
                    Charts.initAnalyticsCharts();
                    break;
                case 'architecture':
                    this.updateRelativisticCalculator();
                    break;
                case 'risks':
                    // Sandbox is ready
                    break;
            }
        }, 50);
    },

    /* ============================================================
       SIDEBAR & NOTIFICATIONS
       ============================================================ */
    setupSidebarToggle() {
        const toggleBtn = document.getElementById('sidebar-toggle');
        const sidebar = document.getElementById('sidebar');
        const main = document.getElementById('main-content');

        if (toggleBtn && sidebar) {
            toggleBtn.addEventListener('click', () => {
                if (window.innerWidth <= 900) {
                    sidebar.classList.toggle('mobile-open');
                } else {
                    sidebar.classList.toggle('collapsed');
                    if (main) main.classList.toggle('sidebar-collapsed');
                }
            });
        }
    },

    setupNotificationCenter() {
        const bell = document.getElementById('notification-bell');
        const panel = document.getElementById('notification-panel');
        const closeBtn = document.getElementById('close-notif');
        const listEl = document.getElementById('notif-list');
        const countBadge = document.getElementById('notif-count');

        const renderNotifs = () => {
            if (!listEl) return;
            listEl.innerHTML = '';
            this.notifications.forEach(item => {
                const div = document.createElement('div');
                div.className = `notif-item ${item.type}`;
                div.innerHTML = `
                    <div class="notif-title">${item.title}</div>
                    <div class="notif-desc">${item.desc}</div>
                    <div class="notif-time">${item.time}</div>
                `;
                div.addEventListener('click', () => {
                    item.unread = false;
                    this.updateNotificationBadge();
                    if (panel) panel.classList.remove('open');
                    if (item.targetPage) this.navigateTo(item.targetPage);
                });
                listEl.appendChild(div);
            });
            this.updateNotificationBadge();
        };

        if (bell && panel) {
            bell.addEventListener('click', () => {
                panel.classList.toggle('open');
                renderNotifs();
            });
        }

        if (closeBtn && panel) {
            closeBtn.addEventListener('click', () => {
                panel.classList.remove('open');
            });
        }

        renderNotifs();
    },

    updateNotificationBadge() {
        const countBadge = document.getElementById('notif-count');
        const unreadCount = this.notifications.filter(n => n.unread).length;
        if (countBadge) {
            countBadge.textContent = unreadCount;
            countBadge.style.display = unreadCount > 0 ? 'flex' : 'none';
        }
    },

    /* ============================================================
       DASHBOARD CONTROLLER
       ============================================================ */
    initDashboard() {
        // Animate KPI numbers
        const activeSatsEl = document.getElementById('kpi-val-active');
        const avgErrorEl = document.getElementById('kpi-val-error');
        const predEl = document.getElementById('kpi-val-pred');
        const corrEl = document.getElementById('kpi-val-corrections');

        if (activeSatsEl) Utils.animateCounter(activeSatsEl, 24, 1200);
        if (avgErrorEl) Utils.animateCounter(avgErrorEl, 2.34, 1200, ' ns');
        if (predEl) Utils.animateCounter(predEl, 96.7, 1200, '%');
        if (corrEl) Utils.animateCounter(corrEl, 1247, 1200);

        // Populate Constellation Mini Grid
        const constGrid = document.getElementById('constellation-status');
        if (constGrid) {
            const consts = [
                { name: 'GPS', sats: '31/31', health: '95%', color: '#6366f1' },
                { name: 'Galileo', sats: '28/30', health: '92%', color: '#3b82f6' },
                { name: 'BeiDou', sats: '30/30', health: '97%', color: '#f97316' },
                { name: 'GLONASS', sats: '24/24', health: '78%', color: '#f43f5e' },
                { name: 'NavIC', sats: '3/7', health: '30%', color: '#ef4444', isCrit: true }
            ];

            constGrid.innerHTML = consts.map(c => `
                <div class="const-mini-card" style="${c.isCrit ? 'border-color: rgba(239, 68, 68, 0.4); background: rgba(239, 68, 68, 0.05);' : ''}">
                    <div class="const-name">${c.name}</div>
                    <div class="const-sats" style="${c.isCrit ? 'color: #ef4444' : ''}">${c.sats}</div>
                    <div class="const-health-bar">
                        <div style="width:${c.health}; background:${c.color}"></div>
                    </div>
                </div>
            `).join('');

            // Click navigates to constellation tab
            constGrid.style.cursor = 'pointer';
            constGrid.addEventListener('click', () => this.navigateTo('constellation'));
        }

        // Populate Recent Alerts
        const alertsList = document.getElementById('alerts-list');
        if (alertsList) {
            const topAlerts = AnomalyDetector.anomalyEvents.slice(0, 4);
            alertsList.innerHTML = topAlerts.map(a => `
                <div class="alert-item ${a.type}">
                    <div class="alert-icon">${a.type === 'critical' ? '⚠️' : '⚡'}</div>
                    <div class="alert-info">
                        <div class="alert-title">${a.title}</div>
                        <div class="alert-desc">${a.description}</div>
                    </div>
                    <div class="alert-time">${a.timestamp.split(' ')[1]}</div>
                </div>
            `).join('');

            alertsList.style.cursor = 'pointer';
            alertsList.addEventListener('click', () => this.navigateTo('anomaly'));
        }

        // Initialize Dashboard Charts
        Charts.initRealtimeErrorChart();
        Charts.initErrorDistributionChart();

        // Wire Realtime Chart Range Buttons
        document.querySelectorAll('.chart-controls .chart-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.chart-controls .chart-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                Charts.initRealtimeErrorChart();
            });
        });

        // Pipeline Step Interactions
        document.querySelectorAll('.pipeline-step').forEach(step => {
            step.addEventListener('click', () => {
                this.navigateTo('architecture');
            });
        });
    },

    /* ============================================================
       SIMULATION CONTROLLER
       ============================================================ */
    initSimulation() {
        const noiseInput = document.getElementById('sim-noise');
        const noiseVal = document.getElementById('sim-noise-val');
        if (noiseInput && noiseVal) {
            noiseInput.addEventListener('input', () => {
                noiseVal.textContent = parseFloat(noiseInput.value).toFixed(2);
            });
        }

        const runBtn = document.getElementById('run-simulation');
        if (runBtn) {
            runBtn.addEventListener('click', () => {
                const config = {
                    clockType: document.getElementById('sim-clock-type')?.value || 'rubidium',
                    initialBias: parseFloat(document.getElementById('sim-initial-bias')?.value || 0.5),
                    driftRate: parseFloat(document.getElementById('sim-drift-rate')?.value || 0.02),
                    noiseLevel: parseFloat(document.getElementById('sim-noise')?.value || 0.3),
                    duration: parseInt(document.getElementById('sim-duration')?.value || 6),
                    injectAnomaly: document.getElementById('sim-inject-anomaly')?.checked ?? true,
                    includeRelativistic: document.getElementById('sim-relativistic')?.checked ?? true
                };

                // Run Simulation
                const simData = Simulator.runSimulation(config);
                this.state.simData = simData;

                // Render Simulation Chart
                Charts.initSimulationChart(simData);

                // Show Results Row
                const resultsRow = document.getElementById('sim-results');
                if (resultsRow) resultsRow.style.display = 'grid';

                const maxEl = document.getElementById('sim-res-max');
                const meanEl = document.getElementById('sim-res-mean');
                const stdEl = document.getElementById('sim-res-std');
                const anmEl = document.getElementById('sim-res-anomalies');

                if (maxEl) maxEl.textContent = simData.stats.maxError;
                if (meanEl) meanEl.textContent = simData.stats.meanError;
                if (stdEl) stdEl.textContent = simData.stats.stdDev;
                if (anmEl) anmEl.textContent = simData.stats.anomalyCount;
            });
        }
    },

    /* ============================================================
       AI PREDICTION CONTROLLER
       ============================================================ */
    initPrediction() {
        const runBtn = document.getElementById('run-prediction');
        const satSelect = document.getElementById('pred-satellite');
        const horizonSelect = document.getElementById('pred-horizon');
        const modelSelect = document.getElementById('pred-model');

        if (runBtn) {
            runBtn.addEventListener('click', () => {
                const sat = satSelect?.value || 'GPS-IIR-01';
                const horizon = parseInt(horizonSelect?.value || 3);
                const model = modelSelect?.value || 'lstm';

                const labelEl = document.getElementById('pred-sat-label');
                if (labelEl) {
                    labelEl.textContent = satSelect.options[satSelect.selectedIndex].text;
                }

                // Generate prediction
                const predData = Predictor.generatePrediction(sat, horizon, model);
                this.state.predData = predData;

                // Render Chart
                Charts.initPredictionChart(predData);

                // Show & Render Comparison
                const compEl = document.getElementById('pred-comparison');
                if (compEl) compEl.style.display = 'grid';
                Charts.initModelComparisonChart();
            });
        }
    },

    /* ============================================================
       ANOMALY DETECTION CONTROLLER
       ============================================================ */
    initAnomaly() {
        // Update KPI Counters
        const totalEl = document.getElementById('anomaly-total');
        const avgRespEl = document.getElementById('anomaly-avg-response');
        const resolvedEl = document.getElementById('anomaly-resolved');
        const activeEl = document.getElementById('anomaly-active');
        const badgeEl = document.getElementById('anomaly-badge');

        const activeCount = AnomalyDetector.getActiveCount();
        if (totalEl) totalEl.textContent = AnomalyDetector.anomalyEvents.length;
        if (avgRespEl) avgRespEl.textContent = AnomalyDetector.getAvgResponseTime();
        if (resolvedEl) resolvedEl.textContent = AnomalyDetector.getResolvedCount();
        if (activeEl) activeEl.textContent = activeCount;
        if (badgeEl) badgeEl.textContent = activeCount;

        // Mode Switching
        document.querySelectorAll('.detection-mode .mode-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.detection-mode .mode-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.state.anomalyMode = btn.getAttribute('data-mode');
                const anmData = AnomalyDetector.generateAnomalyTimeline();
                Charts.initAnomalyChart(anmData);
            });
        });

        // Filter Buttons
        document.querySelectorAll('.filter-group .filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.filter-group .filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.state.anomalyFilter = btn.getAttribute('data-filter');
                this.renderAnomalyLog();
            });
        });

        this.renderAnomalyLog();
    },

    renderAnomalyLog() {
        const logContainer = document.getElementById('anomaly-log');
        if (!logContainer) return;

        const filter = this.state.anomalyFilter;
        let events = AnomalyDetector.anomalyEvents;
        if (filter !== 'all') {
            events = events.filter(e => e.status === filter || e.type === filter);
        }

        logContainer.innerHTML = events.map(e => `
            <div class="anomaly-entry ${e.type}">
                <div class="anomaly-dot"></div>
                <div class="anomaly-details">
                    <div class="anomaly-title">${e.title}</div>
                    <div class="anomaly-desc">${e.description}</div>
                    <div class="anomaly-meta">
                        <span><strong>Satellite:</strong> ${e.satellite}</span>
                        <span><strong>Magnitude:</strong> ${e.magnitude}</span>
                        <span><strong>Response:</strong> ${e.responseTime}</span>
                        <span><strong>Status:</strong> <span class="badge badge-${e.status === 'active' ? 'red' : e.status === 'monitoring' ? 'yellow' : 'green'}">${e.status.toUpperCase()}</span></span>
                    </div>
                </div>
            </div>
        `).join('');
    },

    /* ============================================================
       CORRECTION ENGINE CONTROLLER
       ============================================================ */
    initCorrection() {
        const methodSelect = document.getElementById('correction-method');
        const satSelect = document.getElementById('correction-sat');
        const applyBtn = document.getElementById('apply-correction');

        // Click on Method Cards
        document.querySelectorAll('.methods-grid .method-card').forEach(card => {
            card.addEventListener('click', () => {
                document.querySelectorAll('.methods-grid .method-card').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                const method = card.getAttribute('data-method');
                if (methodSelect) methodSelect.value = method;
                this.applyCorrectionAction();
            });
        });

        if (applyBtn) {
            applyBtn.addEventListener('click', () => this.applyCorrectionAction());
        }

        if (methodSelect) {
            methodSelect.addEventListener('change', () => {
                const method = methodSelect.value;
                document.querySelectorAll('.methods-grid .method-card').forEach(c => {
                    if (c.getAttribute('data-method') === method) {
                        c.classList.add('selected');
                    } else {
                        c.classList.remove('selected');
                    }
                });
                this.applyCorrectionAction();
            });
        }
    },

    applyCorrectionAction() {
        const method = document.getElementById('correction-method')?.value || 'ai-kalman';
        const sat = document.getElementById('correction-sat')?.value || 'GPS-IIR-01';

        const corrData = CorrectionEngine.generateCorrectionData(method, sat);
        this.state.currentCorrection = corrData;

        // Render Chart
        Charts.initCorrectionChart(corrData);

        // Animate Ring Gauge & Percentage
        const ring = document.getElementById('correction-ring');
        const pctEl = document.getElementById('correction-pct');
        const pct = corrData.stats.reductionPct;

        if (pctEl) pctEl.textContent = `${pct}%`;
        if (ring) {
            const circumference = 283;
            const offset = circumference * (1 - pct / 100);
            ring.style.strokeDasharray = circumference;
            ring.style.strokeDashoffset = offset;
        }

        // Update Stats Readout
        const beforeEl = document.getElementById('before-corr');
        const afterEl = document.getElementById('after-corr');
        const posEl = document.getElementById('pos-improve');

        if (beforeEl) beforeEl.textContent = corrData.stats.beforeError;
        if (afterEl) afterEl.textContent = corrData.stats.afterError;
        if (posEl) posEl.textContent = corrData.stats.posImprovement;
    },

    /* ============================================================
       TELEMETRY STREAM CONTROLLER
       ============================================================ */
    initTelemetry() {
        const pauseBtn = document.getElementById('telemetry-pause');
        const clearBtn = document.getElementById('telemetry-clear');

        if (pauseBtn) {
            pauseBtn.addEventListener('click', () => {
                Telemetry.pause();
                this.state.telemetryRunning = Telemetry.isRunning;
                pauseBtn.innerHTML = Telemetry.isRunning
                    ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg> Pause`
                    : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg> Resume`;
            });
        }

        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                Telemetry.clear();
                const consoleEl = document.getElementById('telemetry-console');
                if (consoleEl) consoleEl.innerHTML = '';
                Charts.initTelemetryCharts();
            });
        }

        Charts.initTelemetryCharts();
    },

    onTelemetryTick(dataPoint) {
        // If current page is dashboard, update realtime chart
        if (this.state.currentPage === 'dashboard') {
            Charts.updateRealtimeChart(parseFloat(dataPoint.bias));
        }

        // If current page is telemetry, update charts & prepend row
        if (this.state.currentPage === 'telemetry') {
            Charts.updateTelemetryCharts();
            const consoleEl = document.getElementById('telemetry-console');
            if (consoleEl) {
                const row = document.createElement('div');
                row.className = 'tel-row';
                row.innerHTML = `
                    <span class="tel-time">[${dataPoint.timestamp}]</span>
                    <span class="tel-sat">${dataPoint.satellite.id}</span>
                    <span class="tel-param">Bias: ${dataPoint.bias} ns</span>
                    <span class="tel-val">${dataPoint.temperature}°C | ${dataPoint.signal} dBHz</span>
                    <span class="tel-status ${dataPoint.status}">${dataPoint.status.toUpperCase()}</span>
                `;
                consoleEl.insertBefore(row, consoleEl.firstChild);
                if (consoleEl.children.length > 50) {
                    consoleEl.removeChild(consoleEl.lastChild);
                }
            }
        }
    },

    /* ============================================================
       CONSTELLATION & ANALYTICS CONTROLLER
       ============================================================ */
    initConstellations() {
        Charts.initSISREChart();
        Charts.initStabilityChart();

        // Card Selection
        document.querySelectorAll('.const-card').forEach(card => {
            card.addEventListener('click', () => {
                document.querySelectorAll('.const-card').forEach(c => c.style.borderColor = '');
                card.style.borderColor = 'var(--cyan)';
            });
        });
    },

    initAnalytics() {
        Charts.initAnalyticsCharts();
    },

    /* ============================================================
       FLIGHT ARCHITECTURE & KEPLER CALCULATOR (Slide 3)
       ============================================================ */
    initArchitecture() {
        const aSlider = document.getElementById('calc-a-slider');
        const eSlider = document.getElementById('calc-e-slider');
        const ESlider = document.getElementById('calc-E-slider');

        [aSlider, eSlider, ESlider].forEach(slider => {
            if (slider) {
                slider.addEventListener('input', () => this.updateRelativisticCalculator());
            }
        });

        this.updateRelativisticCalculator();
    },

    updateRelativisticCalculator() {
        const aVal = parseFloat(document.getElementById('calc-a-slider')?.value || 26560);
        const eVal = parseFloat(document.getElementById('calc-e-slider')?.value || 0.010);
        const EVal = parseFloat(document.getElementById('calc-E-slider')?.value || 90);

        // Update readouts
        const aReadout = document.getElementById('calc-a-val');
        const eReadout = document.getElementById('calc-e-val');
        const EReadout = document.getElementById('calc-E-val');

        if (aReadout) aReadout.textContent = `${Utils.formatComma(aVal)} km (${aVal < 30000 ? 'MEO' : 'GEO/GSO'})`;
        if (eReadout) eReadout.textContent = eVal.toFixed(3);
        if (EReadout) EReadout.textContent = `${EVal}° (${Math.round((EVal/360)*100)}% Orbit)`;

        // Keplerian formula calculation
        // Δt_rel = -2 * (sqrt(mu * a) / c^2) * e * sin(E)
        const mu = 3.986004418e14; // m^3/s^2
        const c = 299792458; // m/s
        const aMeters = aVal * 1000;
        const Erad = (EVal * Math.PI) / 180;

        const keplerResidualNs = (-2 * (Math.sqrt(mu * aMeters) / Math.pow(c, 2)) * eVal * Math.sin(Erad)) * 1e9;

        const outKepler = document.getElementById('calc-kepler-out');
        if (outKepler) {
            outKepler.textContent = `${keplerResidualNs >= 0 ? '+' : ''}${keplerResidualNs.toFixed(2)} ns`;
        }

        // Net daily drift = +45 - 7 = +38 μs/day
        const netDriftKm = (38.6 * 299792458) / 1e6; // ~11.57 km/day
        const outNet = document.getElementById('calc-net-out');
        if (outNet) {
            outNet.textContent = `+38.60 μs/day (~${(netDriftKm / 1000).toFixed(1)} km/day range drift)`;
        }
    },

    /* ============================================================
       RISK SAFEGUARDS & FAULT INJECTION SANDBOX (Slide 4)
       ============================================================ */
    initRisks() {
        const seuBtn = document.getElementById('inject-seu-btn');
        const burnoutBtn = document.getElementById('inject-burnout-btn');
        const cmeBtn = document.getElementById('inject-cme-btn');
        const noiseBtn = document.getElementById('inject-noise-btn');
        const resetBtn = document.getElementById('reset-sandbox-btn');

        if (seuBtn) {
            seuBtn.addEventListener('click', () => {
                this.logSandboxConsole('⚡ [ANOMALY DETECTED] Cosmic Radiation SEU Strike in L2 Cache (SRAM bit-flip).', 'con-warn');
                this.logSandboxConsole('🛡️ [TMR MAJORITY VOTER] Disagreement logged (Block A: 0x9AF4 != Block B: 0x9AF0). Voter output: Block A accepted (2/3 majority).', 'con-warn');
                this.logSandboxConsole('⚙️ [AUTONOMOUS FAILOVER] AI Checksum deviated. Instant failover to 2nd-order polynomial physics model engaged in 4.2ms.', 'con-error');
                this.logSandboxConsole('✅ [AUTONOMOUS RE-FLASH] Quantized INT8 weights re-flashed from rad-hard MRAM in 8.1ms (<10ms target). System NOMINAL.', 'con-success');

                const tmrEl = document.getElementById('mon-tmr');
                const badgeEl = document.getElementById('sandbox-state-badge');
                if (tmrEl) tmrEl.innerHTML = '<span class="text-yellow">2/3 (Recovered)</span>';
                if (badgeEl) {
                    badgeEl.textContent = 'SEU RECOVERED';
                    badgeEl.style.color = '#22c55e';
                }
            });
        }

        if (burnoutBtn) {
            burnoutBtn.addEventListener('click', () => {
                this.logSandboxConsole('🔥 [HARDWARE ALERT] Primary Rubidium Lamp frequency aging rate (df/dt) spiked to 0.28 ns/s².', 'con-error');
                this.logSandboxConsole('⚠️ [PRE-FAILURE INFLECTION] Multi-epoch trend indicates imminent physics package cutoff (IRNSS-1A failure signature).', 'con-warn');
                this.logSandboxConsole('🔀 [AUTONOMOUS HANDOVER] Command bus switched to Cold-Standby Passive Hydrogen Maser in 380 ms (<500ms target).', 'con-success');
                this.logSandboxConsole('📡 [INTEGRITY BROADCAST] Navigation Integrity Alert flag transmitted. Standby clock steering verified. Mission continuity 100%.', 'con-success');

                const clkEl = document.getElementById('mon-clk');
                const badgeEl = document.getElementById('sandbox-state-badge');
                if (clkEl) clkEl.innerHTML = '<span class="text-cyan">Standby PHM Active</span>';
                if (badgeEl) {
                    badgeEl.textContent = 'FAILOVER NOMINAL';
                    badgeEl.style.color = '#06b6d4';
                }
            });
        }

        if (cmeBtn) {
            cmeBtn.addEventListener('click', () => {
                this.logSandboxConsole('☀️ [SPACE WEATHER] Severe Coronal Mass Ejection (CME) & orbital eclipse thermal shock detected (+14.2°C/min).', 'con-warn');
                this.logSandboxConsole('📈 [KALMAN Q-ADAPTATION] Sliding-window Kalman filter online covariance matrix Q dynamically scaled 4.5x.', 'con-warn');
                this.logSandboxConsole('🔒 [PHYSICS GUARDRAILS] AI raw prediction attempted 7.8 ns step. Bounded strictly to ±5.0 ns certified aerospace limit.', 'con-success');
                this.logSandboxConsole('✈️ [ICAO STANDARD] Model saturation averted. Clock phase steering conforms to ICAO Category-III aviation safety envelope.', 'con-success');

                const guardEl = document.getElementById('mon-guard');
                if (guardEl) guardEl.innerHTML = '<span class="text-green">Clamped ±5.0 ns</span>';
            });
        }

        if (noiseBtn) {
            noiseBtn.addEventListener('click', () => {
                this.logSandboxConsole('📡 [SENSOR SPURIOUS SPIKE] Transient ionospheric scintillation created 4.8σ pseudorange spike at receiver.', 'con-warn');
                this.logSandboxConsole('⏱️ [PERSISTENCE GATE] Epoch 1 anomalous (>3σ). Holding steering action...', 'con-warn');
                this.logSandboxConsole('🔍 [WAVELET DECOMPOSITION] Daubechies DWT isolates white phase noise. Epoch 2 returned to 0.8σ.', 'con-success');
                this.logSandboxConsole('🛡️ [FALSE ALARM SQUELCHED] Persistence gate rejected false jump (<0.01% false alarm rate). Actuator over-steering prevented.', 'con-success');
            });
        }

        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                const consoleEl = document.getElementById('sandbox-console');
                if (consoleEl) {
                    consoleEl.innerHTML = `
                        <div class="con-line">[00:00:01] System boot verified. Cobham LEON4 @ 200 MHz online.</div>
                        <div class="con-line">[00:00:02] Rad-hard MRAM loaded. INT8 Bi-LSTM quantized weights verified (CRC: 0x9AF4).</div>
                        <div class="con-line">[00:00:03] Triple Modular Redundancy (TMR) memory protection ACTIVE.</div>
                        <div class="con-line">[00:00:04] Primary Rubidium atomic clock phase tracking nominal (drift: 0.012 ns/s).</div>
                        <div class="con-line con-success">[00:00:05] All autonomous safeguards online. Ready for live fault injection.</div>
                    `;
                }

                const tmrEl = document.getElementById('mon-tmr');
                const clkEl = document.getElementById('mon-clk');
                const crcEl = document.getElementById('mon-crc');
                const guardEl = document.getElementById('mon-guard');
                const badgeEl = document.getElementById('sandbox-state-badge');

                if (tmrEl) tmrEl.innerHTML = '<span class="text-green">3/3 Sync</span>';
                if (clkEl) clkEl.innerHTML = '<span class="text-green">Primary Active</span>';
                if (crcEl) crcEl.innerHTML = '<span class="text-green">VALID (0x9AF4)</span>';
                if (guardEl) guardEl.innerHTML = '<span class="text-green">±5.0 ns Bounded</span>';
                if (badgeEl) {
                    badgeEl.textContent = 'NOMINAL';
                    badgeEl.style.color = '#22c55e';
                }
            });
        }
    },

    logSandboxConsole(msg, className = 'con-line') {
        const consoleEl = document.getElementById('sandbox-console');
        if (!consoleEl) return;
        const now = new Date();
        const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
        const line = document.createElement('div');
        line.className = className;
        line.textContent = `[${timeStr}] ${msg}`;
        consoleEl.appendChild(line);
        consoleEl.scrollTop = consoleEl.scrollHeight;
    },

    /* ============================================================
       2-MINUTE LIVE DEMO TOUR CONTROLLER (Slide 6)
       ============================================================ */
    initLiveDemo() {
        const launchBtn = document.getElementById('launch-demo-btn');
        const modal = document.getElementById('demo-modal');
        const closeBtn = document.getElementById('close-demo-btn');
        const nextBtn = document.getElementById('demo-next-btn');
        const prevBtn = document.getElementById('demo-prev-btn');
        const autoBtn = document.getElementById('demo-auto-btn');

        if (launchBtn && modal) {
            launchBtn.addEventListener('click', () => {
                modal.classList.remove('hidden');
                this.state.demo.isOpen = true;
                this.state.demo.currentStep = 1;
                this.renderDemoStep(1);
                this.startDemoTimer();
            });
        }

        if (closeBtn && modal) {
            closeBtn.addEventListener('click', () => {
                modal.classList.add('hidden');
                this.state.demo.isOpen = false;
                this.stopDemoTimer();
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                if (this.state.demo.currentStep < this.state.demo.totalSteps) {
                    this.state.demo.currentStep++;
                    this.renderDemoStep(this.state.demo.currentStep);
                }
            });
        }

        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                if (this.state.demo.currentStep > 1) {
                    this.state.demo.currentStep--;
                    this.renderDemoStep(this.state.demo.currentStep);
                }
            });
        }

        if (autoBtn) {
            autoBtn.addEventListener('click', () => {
                this.state.demo.autoPlaying = !this.state.demo.autoPlaying;
                autoBtn.textContent = this.state.demo.autoPlaying ? '⏸ Pause Auto-Play' : '▶ Auto-Play Demo';
                if (this.state.demo.autoPlaying) {
                    this.runDemoAutoPlay();
                }
            });
        }

        // Stepper item clicks
        document.querySelectorAll('.demo-step').forEach(step => {
            step.addEventListener('click', () => {
                const s = parseInt(step.getAttribute('data-dstep'));
                this.state.demo.currentStep = s;
                this.renderDemoStep(s);
            });
        });
    },

    renderDemoStep(step) {
        // Update stepper UI
        document.querySelectorAll('.demo-step').forEach(s => {
            const num = parseInt(s.getAttribute('data-dstep'));
            s.classList.remove('active', 'completed');
            if (num === step) s.classList.add('active');
            else if (num < step) s.classList.add('completed');
        });

        // Prev/Next buttons
        const prevBtn = document.getElementById('demo-prev-btn');
        const nextBtn = document.getElementById('demo-next-btn');
        if (prevBtn) prevBtn.disabled = step === 1;
        if (nextBtn) {
            nextBtn.textContent = step === 5 ? 'Finish Demo ✔' : 'Next Step ➔';
            if (step === 5) {
                nextBtn.onclick = () => {
                    const modal = document.getElementById('demo-modal');
                    if (modal) modal.classList.add('hidden');
                    this.stopDemoTimer();
                };
            } else {
                nextBtn.onclick = () => {
                    this.state.demo.currentStep++;
                    this.renderDemoStep(this.state.demo.currentStep);
                };
            }
        }

        // Step Content Data
        const stepsData = {
            1: {
                title: 'Stage 1: Spacecraft Steady-State Telemetry Ingestion',
                badgeText: 'Nominal Orbit',
                badgeClass: 'badge-green',
                clk: 'Primary Rubidium Standard',
                bias: '+0.48 ns',
                biasClass: 'text-cyan',
                lat: '11.8 ms (<50ms target)',
                err: '0.14 m (<0.6m Sub-Meter)',
                heading: 'Nominal Orbit Ingestion & Physics Dilation Baseline',
                explanation: 'The spacecraft Onboard Computer continuously ingests Rubidium atomic clock phase at 1 Hz. Deterministic Keplerian relativistic dilation (-2√(μa)/c²·e·sin E = ~22.95 ns) and Daubechies DWT wavelet denoising are applied in real-time.'
            },
            2: {
                title: 'Stage 2: Sudden Thermal Shock Anomaly Injected',
                badgeText: 'ANOMALY INJECTED',
                badgeClass: 'badge-red',
                clk: 'Primary Rubidium Standard',
                bias: '+4.72 ns (Discontinuity)',
                biasClass: 'text-red',
                lat: '12.4 ms',
                err: '1.42 m (Degraded)',
                heading: 'Eclipse Boundary Thermal Shock & Phase Jump',
                explanation: 'Spacecraft enters orbital eclipse transition. Abrupt 10⁻¹³/Δ°C thermal shock triggers a sharp 4.72 ns phase jump. Without immediate autonomous correction, positioning error on the ground would exceed 1.4 meters.'
            },
            3: {
                title: 'Stage 3: 3σ Chi-Square Innovation Gate Squelch',
                badgeText: '3σ INNOVATION GATE TRIGGERED',
                badgeClass: 'badge-yellow',
                clk: 'Fast Verification Gate',
                bias: '+4.72 ns (Residual Isolated)',
                biasClass: 'text-yellow',
                lat: '1.2 ms Gate Evaluation',
                err: '1.42 m (Integrity Alert Ready)',
                heading: 'Sub-Epoch Anomaly Detection & Persistence Gate',
                explanation: 'The χ² innovation filter detects the phase jump in less than 1 epoch. Spurious receiver noise is ruled out via the 3-epoch persistence gate. The OBC marks the anomaly as a genuine physical clock transient.'
            },
            4: {
                title: 'Stage 4: Edge-Quantized Bi-LSTM Inference & Digital Steering',
                badgeText: 'CLOSED LOOP ACTIVE',
                badgeClass: 'badge-cyan',
                clk: 'Digital Frequency Synthesizer',
                bias: 'Correcting: 4.72 ns ➔ 0.22 ns',
                biasClass: 'text-cyan',
                lat: '11.8 ms Inference (<50 ms Total)',
                err: '0.07 m Ground Precision',
                heading: 'Real-Time Onboard Steering (<50ms Closed Loop)',
                explanation: 'Compiled via quantized C++17 and TF-Lite Micro on the Cobham LEON4 MCU. The AI model predicts non-linear thermal residuals and directly commands spacecraft frequency steer registers with 0.05 ns synthesizer steps.'
            },
            5: {
                title: 'Stage 5: Autonomous Recovery & Sub-Meter PNT Verification',
                badgeText: 'PNT CONTINUITY SECURED',
                badgeClass: 'badge-green',
                clk: 'Autonomous Closed-Loop Stabilized',
                bias: '0.24 ns (<0.30 ns Target)',
                biasClass: 'text-green',
                lat: 'Loop Latency: 18.2 ms',
                err: '0.072 m (7.2 cm Range Error)',
                heading: 'Sub-Decimeter Accuracy & Zero Mission Outage',
                explanation: 'Clock error is reduced by 84% (down to 0.24 ns, or 7.2 cm equivalent range error). The navigation frame transmits clean timing to ground receivers with zero ground control uplink dependency.'
            }
        };

        const data = stepsData[step];
        if (!data) return;

        const visTitle = document.getElementById('demo-vis-title');
        const visBadge = document.getElementById('demo-vis-badge');
        const dtClk = document.getElementById('dt-clk');
        const dtBias = document.getElementById('dt-bias');
        const dtLat = document.getElementById('dt-lat');
        const dtErr = document.getElementById('dt-err');
        const expEl = document.getElementById('demo-explanation');

        if (visTitle) visTitle.textContent = data.title;
        if (visBadge) {
            visBadge.textContent = data.badgeText;
            visBadge.className = `badge ${data.badgeClass}`;
        }
        if (dtClk) dtClk.textContent = data.clk;
        if (dtBias) {
            dtBias.textContent = data.bias;
            dtBias.className = data.biasClass;
        }
        if (dtLat) dtLat.textContent = data.lat;
        if (dtErr) dtErr.textContent = data.err;

        if (expEl) {
            expEl.innerHTML = `
                <h3>${data.heading}</h3>
                <p>${data.explanation}</p>
            `;
        }
    },

    startDemoTimer() {
        this.stopDemoTimer();
        this.state.demo.timerSeconds = 120;
        const timerEl = document.getElementById('demo-timer-val');

        this.state.demo.intervalId = setInterval(() => {
            if (this.state.demo.timerSeconds > 0) {
                this.state.demo.timerSeconds--;
                const mins = Math.floor(this.state.demo.timerSeconds / 60);
                const secs = this.state.demo.timerSeconds % 60;
                if (timerEl) {
                    timerEl.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
                }
            } else {
                this.stopDemoTimer();
            }
        }, 1000);
    },

    stopDemoTimer() {
        if (this.state.demo.intervalId) {
            clearInterval(this.state.demo.intervalId);
            this.state.demo.intervalId = null;
        }
    },

    runDemoAutoPlay() {
        if (!this.state.demo.autoPlaying) return;
        const advance = () => {
            if (!this.state.demo.autoPlaying || !this.state.demo.isOpen) return;
            if (this.state.demo.currentStep < this.state.demo.totalSteps) {
                this.state.demo.currentStep++;
                this.renderDemoStep(this.state.demo.currentStep);
                setTimeout(advance, 6000);
            } else {
                this.state.demo.autoPlaying = false;
                const autoBtn = document.getElementById('demo-auto-btn');
                if (autoBtn) autoBtn.textContent = '▶ Auto-Play Demo';
            }
        };
        setTimeout(advance, 6000);
    }
};

// Initialize SatSync AI when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
