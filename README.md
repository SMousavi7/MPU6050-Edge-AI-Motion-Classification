# MPU6050 Edge AI Motion Classification

An AIoT motion classification system that performs real-time inference on simulated MPU6050 sensor data using an Edge Impulse model and publishes the results to ThingsBoard through MQTT.

The project demonstrates an end-to-end Edge AI workflow, from sensor data generation and feature extraction to model training, WebAssembly inference, real-time telemetry, dashboard visualization, and motion-based alerts.

## Overview

The system classifies MPU6050 accelerometer and gyroscope readings into three motion states:

* **Idle** — no significant movement
* **Move** — moderate movement
* **Shake** — rapid or intense movement

Sensor data is generated using a simulated MPU6050 device in Velxio and published through MQTT.

The gateway receives the sensor readings, extracts both raw and differential motion features, performs inference locally using an Edge Impulse model exported as WebAssembly, and forwards the prediction results to ThingsBoard.

ThingsBoard is used to visualize the detected motion state and create an alarm whenever a `Shake` state is detected.

## Architecture

```text
┌──────────────────────┐
│ Velxio MPU6050       │
│ Simulator            │
└──────────┬───────────┘
           │
           │ MQTT
           ▼
┌──────────────────────┐
│ MQTT Broker          │
│ Raw Sensor Data      │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────────────┐
│ TypeScript Edge Gateway      │
│                              │
│ - Receive sensor readings    │
│ - Extract features           │
│ - Run Edge Impulse model     │
│ - Generate prediction        │
└──────────┬───────────────────┘
           │
           │ MQTT Telemetry
           ▼
┌──────────────────────┐
│ ThingsBoard          │
│                      │
│ - Live dashboard     │
│ - Motion state       │
│ - Confidence         │
│ - Shake alarm        │
└──────────────────────┘
```

## Dataset and Features

The dataset was generated using a simulated MPU6050 sensor.

For each motion class, multiple data collection runs were performed while changing the simulated sensor behavior to represent the intended motion pattern.

The raw sensor features consist of three-axis accelerometer and gyroscope measurements:

```text
accX
accY
accZ
gyroX
gyroY
gyroZ
```

In addition to the raw sensor values, **differential features** are calculated between consecutive samples. These features represent the change in each sensor measurement over time:

```text
dAccX
dAccY
dAccZ
dGyroX
dGyroY
dGyroZ
```

For example:

```text
dAccX = currentAccX - previousAccX
dGyroX = currentGyroX - previousGyroX
```

Using these differential features allows the model to capture how rapidly the sensor readings are changing, providing additional information about the dynamics of the movement rather than relying only on the absolute sensor values.

The three target labels are:

```text
Idle
Move
Shake
```

The collected datasets were uploaded to Edge Impulse and used for training and evaluating the motion classification models.

## Model Training

The models were trained and evaluated using Edge Impulse.

Multiple model configurations were tested to compare their classification performance. The selected model was exported from Edge Impulse as a WebAssembly model, allowing inference to be performed locally inside the TypeScript gateway.

The exported model consists primarily of:

```text
edge-impulse-standalone.js
edge-impulse-standalone.wasm
```

This allows motion classification to run locally without sending the raw sensor data to a cloud inference service.

## Edge Inference

The TypeScript gateway subscribes to the raw MPU6050 MQTT topic:

```text
iot/mpu6050/raw
```

For each incoming sample, the gateway processes the raw accelerometer and gyroscope values and calculates the corresponding differential features.

The resulting feature vector contains both the current sensor readings and their changes relative to the previous sample.

The feature vector is then passed to the Edge Impulse model for inference.

The model returns the probability for each motion class, and the class with the highest confidence is selected as the current motion state.

Example prediction:

```json
{
  "motion": "shake",
  "confidence": 0.97
}
```

## ThingsBoard Integration

After classification, the gateway publishes telemetry to ThingsBoard through MQTT.

The telemetry contains the sensor measurements together with inference information such as:

```text
motion
confidence
isShake
modelResults
```

ThingsBoard is used to:

* visualize the detected motion state in real time;
* monitor model predictions and sensor values;
* trigger an alarm when the detected state is `Shake`.

## Project Structure

```text
.
├── data/
│   ├── idle/
│   ├── move/
│   └── shake/
│
├── models/
│   ├── model-1/
│   │   ├── edge-impulse-standalone.js
│   │   └── edge-impulse-standalone.wasm
│   └── model-2/
│       ├── edge-impulse-standalone.js
│       └── edge-impulse-standalone.wasm
│
├── src/
│   ├── gateway.ts
│   ├── gateway2.ts
│   ├── model.ts
│   └── model2.ts
│
├── simulator/
│   └── mpu6050.c
│
├── docs/
│   └── report.pdf
│
├── .gitignore
├── package.json
└── README.md
```

## Requirements

* Bun / Node.js
* MQTT broker
* ThingsBoard
* Velxio or another MPU6050 data source
* Edge Impulse exported WebAssembly model

## Installation

Install the project dependencies:

```bash
bun install
```

Before running the gateway, configure the ThingsBoard connection and device credentials in the gateway according to your ThingsBoard installation.

## Running the Gateway

Run the gateway using Bun:

```bash
bun run src/gateway.ts
```

The gateway will:

1. initialize the Edge Impulse WebAssembly model;
2. connect to the MQTT broker;
3. subscribe to MPU6050 measurements;
4. extract raw and differential motion features;
5. perform local motion classification;
6. publish the prediction results to ThingsBoard.

## Technologies

* TypeScript
* Bun / Node.js
* MQTT
* Edge Impulse
* WebAssembly
* ThingsBoard
* MPU6050
* Velxio
* TinyML / Edge AI

## Project Report

The complete coursework report, including model evaluation results, confusion matrices, system setup, ThingsBoard dashboard, and rule-chain configuration, is available in the `docs` directory.

## Authors

This project was developed collaboratively by:

* **[@SMousavi7](https://github.com/SMousavi7)**
* **[@MilladAnsari](https://github.com/MilladAnsari)**

Developed as part of the **Internet of Things** course project, focusing on AIoT, TinyML, and Edge AI inference.
