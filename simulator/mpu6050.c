#include <Wire.h>
#include <WiFi.h>
#include <PubSubClient.h>

#define MPU_ADDR 0x68

const char* WIFI_SSID = "Velxio-GUEST";
const char* WIFI_PASSWORD = "";

const char* MQTT_HOST = "custom";
const int MQTT_PORT = 1884;

const char* MQTT_USERNAME = "";
const char* MQTT_PASSWORD = "";

const char* MQTT_TOPIC = "iot/mpu6050/raw";

WiFiClient wifiClient;
PubSubClient mqttClient(wifiClient);

int16_t accX, accY, accZ;
int16_t gyroX, gyroY, gyroZ;

void readMPU6050();

void connectWifi() {
  WiFi.begin(WIFI_SSID);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.println("Connecting to WiFi...");
  }

  Serial.println("WiFi connected");
}

void connectMqtt() {
  while (!mqttClient.connected()) {
    Serial.println("Connecting to MQTT broker...");

    if (mqttClient.connect("velxio-mpu6050-client", MQTT_USERNAME, MQTT_PASSWORD)) {
      Serial.println("MQTT connected");
    } else {
      Serial.print("MQTT failed, state=");
      Serial.println(mqttClient.state());
      delay(2000);
    }
  }
}

void setup() {
  Serial.begin(115200);

  Wire.begin(21, 22);

  Wire.beginTransmission(MPU_ADDR);
  Wire.write(0x6B);
  Wire.write(0);
  Wire.endTransmission(true);

  connectWifi();

  mqttClient.setServer(MQTT_HOST, MQTT_PORT);
  connectMqtt();

  Serial.println("MPU6050 started successfully");
}

void loop() {
  if (!mqttClient.connected()) {
    connectMqtt();
  }

  mqttClient.loop();

  readMPU6050();

  String payload = "{";
  payload += "\"timeMs\":";
  payload += millis();
  payload += ",";
  payload += "\"accX\":";
  payload += accX;
  payload += ",";
  payload += "\"accY\":";
  payload += accY;
  payload += ",";
  payload += "\"accZ\":";
  payload += accZ;
  payload += ",";
  payload += "\"gyroX\":";
  payload += gyroX;
  payload += ",";
  payload += "\"gyroY\":";
  payload += gyroY;
  payload += ",";
  payload += "\"gyroZ\":";
  payload += gyroZ;
  payload += "}";

  mqttClient.publish(MQTT_TOPIC, payload.c_str());

  Serial.println(payload);

  delay(100);
}

void readMPU6050() {
  Wire.beginTransmission(MPU_ADDR);
  Wire.write(0x3B);
  Wire.endTransmission(false);

  Wire.requestFrom(MPU_ADDR, 14, true);

  accX = Wire.read() << 8 | Wire.read();
  accY = Wire.read() << 8 | Wire.read();
  accZ = Wire.read() << 8 | Wire.read();

  Wire.read();
  Wire.read();

  gyroX = Wire.read() << 8 | Wire.read();
  gyroY = Wire.read() << 8 | Wire.read();
  gyroZ = Wire.read() << 8 | Wire.read();
}