/* ============================================================
   SatSync AI — AI Prediction Engine (Simulated LSTM)
   Simulates LSTM-based clock error prediction
   ============================================================ */

const Predictor = {
    // Model configurations
    models: {
        lstm: {
            name: 'LSTM',
            mae: 0.047,
            rmse: 0.062,
            r2: 0.967,
            improvement: 93,
            color: '#a855f7',
            description: 'Long Short-Term Memory Neural Network'
        },
        'cnn-lstm': {
            name: 'CNN-LSTM-Attention',
            mae: 0.052,
            rmse: 0.071,
            r2: 0.952,
            improvement: 89,
            color: '#06b6d4',
            description: 'Convolutional + LSTM with Attention Mechanism'
        },
        polynomial: {
            name: 'Polynomial',
            mae: 0.312,
            rmse: 0.487,
            r2: 0.721,
            improvement: 0,
            color: '#64748b',
            description: 'Traditional Quadratic Polynomial Model'
        },
        'kalman-nn': {
            name: 'Kalman-NN Hybrid',
            mae: 0.061,
            rmse: 0.083,
            r2: 0.943,
            improvement: 85,
            color: '#6366f1',
            description: 'Neural-Augmented Extended Kalman Filter'
        }
    },

    /**
     * Generate prediction for a satellite
     * @param {string} satelliteId - Satellite identifier
     * @param {number} horizon - Prediction horizon in hours
     * @param {string} modelType - Model to use
     * @returns {Object} Historical data + predictions with confidence intervals
     */
    generatePrediction(satelliteId, horizon = 3, modelType = 'lstm') {
        const model = this.models[modelType];
        const samplesPerHour = 30;
        const historicalHours = 6;
        const historicalSamples = historicalHours * samplesPerHour;
        const predictionSamples = horizon * samplesPerHour;

        // Generate realistic historical clock error data
        const historical = this._generateHistoricalData(historicalSamples, satelliteId);
        
        // Generate predictions based on the model
        const predictions = this._generatePredictions(
            historical, predictionSamples, model, horizon
        );

        // Generate time labels
        const totalSamples = historicalSamples + predictionSamples;
        const labels = [];
        for (let i = 0; i < totalSamples; i++) {
            const hoursFromNow = (i - historicalSamples) / samplesPerHour;
            const t = new Date(Date.now() + hoursFromNow * 3600000);
            labels.push(t.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }));
        }

        return {
            labels,
            historical: historical.data,
            predictions: predictions.predicted,
            upperBound: predictions.upper,
            lowerBound: predictions.lower,
            splitIndex: historicalSamples,
            model: model,
            satellite: satelliteId,
            horizon
        };
    },

    _generateHistoricalData(samples, satelliteId) {
        const data = [];
        // Different satellites have different base characteristics
        const baseParams = {
            'GPS-IIR-01': { bias: 1.2, drift: 0.015, noise: 0.12 },
            'GPS-IIF-12': { bias: 0.8, drift: 0.01, noise: 0.1 },
            'GAL-FOC-07': { bias: 0.5, drift: 0.008, noise: 0.08 },
            'BDS3-MEO-15': { bias: 0.4, drift: 0.006, noise: 0.06 },
            'IRNSS-1B': { bias: 2.5, drift: 0.03, noise: 0.25 }
        };
        const params = baseParams[satelliteId] || baseParams['GPS-IIR-01'];

        for (let i = 0; i < samples; i++) {
            const t = i / 30; // time in hours
            const drift = params.bias + params.drift * t;
            const noise = Utils.gaussRandom(0, params.noise);
            const periodic = 0.08 * Math.sin(2 * Math.PI * t / 4);
            data.push(drift + noise + periodic);
        }

        return { data, params };
    },

    _generatePredictions(historical, predSamples, model, horizon) {
        const predicted = [];
        const upper = [];
        const lower = [];
        
        // Use the last few historical points to start prediction
        const lastValues = historical.data.slice(-10);
        const lastVal = lastValues[lastValues.length - 1];
        const trend = (lastValues[lastValues.length - 1] - lastValues[0]) / lastValues.length;

        // Model-specific noise scaling
        const modelNoise = model.mae;
        
        for (let i = 0; i < predSamples; i++) {
            const t = i / 30; // hours into future
            
            // Base prediction follows trend
            let pred = lastVal + trend * i;
            
            // Add model-specific variation
            pred += Utils.gaussRandom(0, modelNoise * 0.5);
            
            // Add slight periodic component
            pred += 0.03 * Math.sin(2 * Math.PI * t / 3);

            predicted.push(pred);

            // Confidence interval widens with prediction horizon
            const uncertaintyGrowth = modelNoise * (1 + t * 0.3);
            upper.push(pred + 1.96 * uncertaintyGrowth);
            lower.push(pred - 1.96 * uncertaintyGrowth);
        }

        return { predicted, upper, lower };
    },

    /**
     * Generate model comparison data
     */
    generateComparison(satelliteId, horizon) {
        const results = {};
        for (const [key, model] of Object.entries(this.models)) {
            results[key] = this.generatePrediction(satelliteId, horizon, key);
        }
        return results;
    }
};
