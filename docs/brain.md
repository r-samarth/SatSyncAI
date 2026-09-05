# 🧠 Project Brain — AI-Based Satellite Clock Error Prediction & Real-Time Correction

## Project Overview
- **Event**: Smart India Hackathon 2026
- **Theme**: Space Technology | **PS Category**: Software
- **Team**: Error 404

## Problem Statement
Satellite clock errors (drift, noise, anomalies) cause positioning errors in GNSS systems. 1ns error ≈ 0.3m positioning error. If uncorrected, relativistic effects alone cause ~10km/day drift.

## Solution
AI/ML system to simulate satellite clock behaviour, learn error patterns, predict errors before they grow, and correct them in real-time.

## Core Pipeline (8 Steps)
1. **Simulate** satellite clock behaviour (Physics-Based)
2. **Collect** clock data through telemetry
3. **Predict** errors using LSTM + Polynomial model
4. **Detect** drift, noise & anomalies
5. **Generate** corrections using Correction Engine
6. **Apply** corrections through OBC
7. **Monitor** corrected clock in real time
8. **Continuously** track clock performance

## Tech Stack
- Python, TensorFlow/Keras, NumPy, Pandas, Matplotlib
- PySide6/PyQt for desktop dashboard
- C/C++ for OBC/embedded
- RTOS for real-time task management
- CSV/SQLite for data storage
- Physics-Based Modelling for simulation

## Full-Stack Prototype (Web App)
- **Framework**: Vite + Vanilla JS (single-page app)
- **Backend Simulation**: Client-side simulated data (no actual server needed for demo)
- **Pages/Sections**:
  1. Landing/Dashboard — real-time satellite monitoring overview
  2. Clock Simulation — simulate clock drift, noise, anomalies
  3. AI Prediction — LSTM prediction visualizations with charts
  4. Anomaly Detection — real-time anomaly alerts
  5. Correction Engine — apply and visualize corrections
  6. Telemetry Monitor — live telemetry data stream
  7. Analytics — performance metrics and statistics

## Key Data Points for Reference
- GPS SISRE: ~30cm, Galileo: 14-50cm, BeiDou: ~5cm
- NavIC: Only 3 of 4 required satellites operational (Sept 2026)
- GPS outage cost: ~$1B/day (US economy)
- LSTM achieves 40-93% accuracy improvement over traditional models

## File Structure
```
SIH/
├── brain.md                    ← This file
├── prototype/                  ← Full-stack web prototype
│   ├── index.html
│   ├── css/
│   │   └── styles.css
│   ├── js/
│   │   ├── app.js              ← Main app logic & routing
│   │   ├── simulator.js        ← Clock simulation engine
│   │   ├── predictor.js        ← AI/LSTM prediction (simulated)
│   │   ├── anomaly.js          ← Anomaly detection engine
│   │   ├── correction.js       ← Correction engine
│   │   ├── telemetry.js        ← Telemetry data generator
│   │   ├── charts.js           ← Chart rendering (Chart.js)
│   │   └── utils.js            ← Utility functions
│   └── assets/
│       └── ...                 ← Images, icons
├── Presentation_Upgraded.pptx
├── Presentation_Upgraded.pdf
├── Satellite_Clock_Error_Real_Time_Data_Issues_Research.txt
└── Satellite_Clock_Error_Research_Report.pdf
```
