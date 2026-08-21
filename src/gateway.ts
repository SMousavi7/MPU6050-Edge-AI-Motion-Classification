import mqtt from "mqtt";
import { classifyMotion, initModel } from "./model.ts";
import "dotenv/config";

type SensorData = {
  timeMs?: number;
  accX: number;
  accY: number;
  accZ: number;
  gyroX: number;
  gyroY: number;
  gyroZ: number;
};

const RAW_MQTT_URL = "mqtt://localhost:1884";
const RAW_TOPIC = "iot/mpu6050/raw";

const THINGSBOARD_MQTT_URL = "mqtt://localhost:1883";
const THINGSBOARD_TOKEN = process.env.THINGSBOARD_TOKEN;

let previous: SensorData | null = null;

main().catch((error) => {
  console.error("Gateway startup error:", error);
  process.exit(1);
});

async function main() {
  await initModel();

  console.log("Edge Impulse model initialized");
  console.log("Starting gateway...");
  console.log("RAW_MQTT_URL:", RAW_MQTT_URL);
  console.log("RAW_TOPIC:", RAW_TOPIC);
  console.log("THINGSBOARD_MQTT_URL:", THINGSBOARD_MQTT_URL);

  const rawClient = mqtt.connect(RAW_MQTT_URL, {
    clientId: "raw-gateway-" + Date.now(),
  });

  const thingsboardClient = mqtt.connect(THINGSBOARD_MQTT_URL, {
    username: THINGSBOARD_TOKEN,
    clientId: "thingsboard-gateway-" + Date.now(),
  });

  rawClient.on("connect", () => {
    console.log("Raw MQTT connected");

    rawClient.subscribe(RAW_TOPIC, (error) => {
      if (error) {
        console.error("Raw subscribe error:", error.message);
        return;
      }

      console.log("Subscribed to raw topic:", RAW_TOPIC);
    });
  });

  thingsboardClient.on("connect", () => {
    console.log("ThingsBoard MQTT connected");
  });

  rawClient.on("message", (_topic, payload) => {
    try {
      const current = JSON.parse(payload.toString()) as SensorData;

      const delta = previous
        ? {
            dAccX: current.accX - previous.accX,
            dAccY: current.accY - previous.accY,
            dAccZ: current.accZ - previous.accZ,
            dGyroX: current.gyroX - previous.gyroX,
            dGyroY: current.gyroY - previous.gyroY,
            dGyroZ: current.gyroZ - previous.gyroZ,
          }
        : {
            dAccX: 0,
            dAccY: 0,
            dAccZ: 0,
            dGyroX: 0,
            dGyroY: 0,
            dGyroZ: 0,
          };

      previous = current;

      const features = [
        current.accX,
        current.accY,
        current.accZ,
        current.gyroX,
        current.gyroY,
        current.gyroZ,
        delta.dAccX,
        delta.dAccY,
        delta.dAccZ,
        delta.dGyroX,
        delta.dGyroY,
        delta.dGyroZ,
      ];

      const prediction = classifyMotion(features);

      const telemetry = {
        ...current,
        ...delta,
        motion: prediction.motion,
        confidence: prediction.confidence,
        isShake: prediction.motion.toLowerCase() === "shake",
        modelResults: JSON.stringify(prediction.results),
      };

      console.log("Publishing to ThingsBoard:", telemetry);

      thingsboardClient.publish(
        "v1/devices/me/telemetry",
        JSON.stringify(telemetry),
        undefined,
        (error) => {
          if (error) console.error("ThingsBoard publish error:", error.message);
          else console.log("Published to ThingsBoard");
        }
      );
    } catch (error) {
      console.error("Gateway processing error:", error);
    }
  });

  rawClient.on("error", (error) => {
    console.error("Raw MQTT error:", error.message);
  });

  thingsboardClient.on("error", (error) => {
    console.error("ThingsBoard MQTT error:", error.message);
  });
}