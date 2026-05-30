#include <Wire.h>
#include <Adafruit_PN532.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// ===== CONFIGURATION =====
// WiFi credentials
const char* WIFI_SSID = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// Backend API
const char* API_URL = "https://spts.onrender.com/api/nfc/tap";
const char* BUS_ID = "BUS-001";  // Unique bus identifier
const char* API_KEY = "your-secure-api-key";  // Get from backend admin

// PN532 I2C pins
#define PN532_SDA 21
#define PN532_SCL 22

// Feedback pins (optional)
#define LED_PIN 2
#define BUZZER_PIN 4

// ===== GLOBALS =====
Adafruit_PN532 nfc(PN532_SDA, PN532_SCL);
unsigned long lastTapTime = 0;
const unsigned long TAP_COOLDOWN = 2000; // 2 seconds between taps

void setup() {
  Serial.begin(115200);
  Serial.println("\n\n=== ESP32 NFC Tap Reader ===");
  
  // Setup feedback pins
  pinMode(LED_PIN, OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);
  
  // Connect to WiFi
  connectWiFi();
  
  // Initialize NFC
  nfc.begin();
  uint32_t versiondata = nfc.getFirmwareVersion();
  
  if (!versiondata) {
    Serial.println("❌ PN532 not found!");
    while (1) {
      blinkError();
      delay(1000);
    }
  }
  
  Serial.print("✓ Found PN532 chip v");
  Serial.println((versiondata >> 16) & 0xFF, HEX);
  
  // Configure PN532
  nfc.SAMConfig();
  
  Serial.println("✓ NFC Reader Ready");
  Serial.println("Waiting for NFC tap...\n");
}

void loop() {
  uint8_t uid[] = { 0, 0, 0, 0, 0, 0, 0 };
  uint8_t uidLength;
  
  // Check for NFC card/phone
  if (nfc.readPassiveTargetID(PN532_MIFARE_ISO14443A, uid, &uidLength, 100)) {
    
    // Cooldown check
    if (millis() - lastTapTime < TAP_COOLDOWN) {
      Serial.println("⏳ Too fast! Wait 2 seconds...");
      return;
    }
    
    lastTapTime = millis();
    
    // Convert UID to hex string
    String nfcId = "";
    for (uint8_t i = 0; i < uidLength; i++) {
      if (uid[i] < 0x10) nfcId += "0";
      nfcId += String(uid[i], HEX);
    }
    nfcId.toUpperCase();
    
    Serial.println("\n📱 NFC Detected!");
    Serial.print("   ID: ");
    Serial.println(nfcId);
    
    // Send to backend
    sendTapToBackend(nfcId);
    
    delay(500);
  }
}

void connectWiFi() {
  Serial.print("Connecting to WiFi");
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✓ WiFi Connected!");
    Serial.print("   IP: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\n❌ WiFi Failed!");
  }
}

void sendTapToBackend(String nfcId) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("❌ No WiFi connection");
    blinkError();
    return;
  }
  
  HTTPClient http;
  http.begin(API_URL);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("Authorization", String("Bearer ") + API_KEY);
  
  // Create JSON payload
  StaticJsonDocument<200> doc;
  doc["nfcId"] = nfcId;
  doc["busId"] = BUS_ID;
  doc["timestamp"] = millis();
  
  String jsonPayload;
  serializeJson(doc, jsonPayload);
  
  Serial.println("📤 Sending to backend...");
  
  int httpCode = http.POST(jsonPayload);
  
  if (httpCode > 0) {
    String response = http.getString();
    Serial.print("   Response: ");
    Serial.println(httpCode);
    
    if (httpCode == 200) {
      // Parse response
      StaticJsonDocument<512> responseDoc;
      DeserializationError error = deserializeJson(responseDoc, response);
      
      if (!error) {
        const char* action = responseDoc["action"];
        const char* message = responseDoc["message"];
        
        Serial.print("   Action: ");
        Serial.println(action);
        Serial.print("   Message: ");
        Serial.println(message);
        
        // Feedback based on action
        if (strcmp(action, "BOARD") == 0) {
          feedbackBoard();
        } else if (strcmp(action, "EXIT") == 0) {
          feedbackExit();
        }
      }
    } else {
      Serial.println("   ❌ Error from server");
      Serial.println(response);
      blinkError();
    }
  } else {
    Serial.print("   ❌ HTTP Error: ");
    Serial.println(httpCode);
    blinkError();
  }
  
  http.end();
}

// Feedback functions
void feedbackBoard() {
  Serial.println("🟢 BOARD - Welcome!");
  // Green LED pattern
  for (int i = 0; i < 2; i++) {
    digitalWrite(LED_PIN, HIGH);
    tone(BUZZER_PIN, 1000, 100);
    delay(100);
    digitalWrite(LED_PIN, LOW);
    delay(100);
  }
}

void feedbackExit() {
  Serial.println("🔴 EXIT - Thank you!");
  // Red LED pattern
  for (int i = 0; i < 3; i++) {
    digitalWrite(LED_PIN, HIGH);
    tone(BUZZER_PIN, 800, 100);
    delay(100);
    digitalWrite(LED_PIN, LOW);
    delay(100);
  }
}

void blinkError() {
  for (int i = 0; i < 5; i++) {
    digitalWrite(LED_PIN, HIGH);
    delay(100);
    digitalWrite(LED_PIN, LOW);
    delay(100);
  }
  tone(BUZZER_PIN, 400, 500);
}
