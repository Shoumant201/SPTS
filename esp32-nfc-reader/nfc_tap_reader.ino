/*
 * ESP32 NFC Tap-to-Ride System
 * Hardware: ESP32 + PN532 NFC Module + 16x2 LCD + Buzzer
 * 
 * Pin Connections:
 * PN532 (I2C Mode):
 *   SDA -> GPIO 21
 *   SCL -> GPIO 22
 *   IRQ -> GPIO 4
 *   RST -> GPIO 16
 *   VCC -> 3.3V
 *   GND -> GND
 * 
 * LCD (16x2):
 *   RS  -> GPIO 13
 *   E   -> GPIO 12
 *   D4  -> GPIO 14
 *   D5  -> GPIO 27
 *   D6  -> GPIO 26
 *   D7  -> GPIO 25
 *   VSS -> GND
 *   VDD -> 5V
 *   V0  -> Potentiometer (contrast)
 *   RW  -> GND
 *   A   -> 5V (backlight)
 *   K   -> GND (backlight)
 * 
 * Buzzer:
 *   + -> GPIO 33
 *   - -> GND
 */

#include <Wire.h>
#include <Adafruit_PN532.h>
#include <LiquidCrystal.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// ===== PIN DEFINITIONS =====
#define PN532_SDA 21
#define PN532_SCL 22
#define PN532_IRQ 4
#define PN532_RST 16

#define LCD_RS 13
#define LCD_E  12
#define LCD_D4 14
#define LCD_D5 27
#define LCD_D6 26
#define LCD_D7 25

#define BUZZER_PIN 33

// ===== CONFIGURATION =====
const char* WIFI_SSID = "HCK Connect";
const char* WIFI_PASSWORD = "#erald77";
const char* API_URL = "https://spts.onrender.com/api/nfc/tap";
const char* BUS_ID = "BA-1-PA-1234";  // Change this to your bus plate number

// ===== HARDWARE INITIALIZATION =====
// Initialize PN532 with IRQ and RESET pins
Adafruit_PN532 nfc(PN532_IRQ, PN532_RST);
LiquidCrystal lcd(LCD_RS, LCD_E, LCD_D4, LCD_D5, LCD_D6, LCD_D7);

// ===== BUZZER CONTROL =====
void beep(int duration) {
  digitalWrite(BUZZER_PIN, HIGH);
  delay(duration);
  digitalWrite(BUZZER_PIN, LOW);
}

// ===== FEEDBACK FUNCTIONS =====
void successFeedback() {
  // Three short beeps
  for (int i = 0; i < 3; i++) {
    beep(100);
    delay(100);
  }
}

void errorFeedback() {
  // One long beep
  beep(500);
}

// ===== WIFI CONNECTION =====
void connectWiFi() {
  Serial.println("Connecting to WiFi...");
  lcd.clear();
  lcd.print("Connecting WiFi");
  
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    lcd.setCursor(0, 1);
    lcd.print("Attempt ");
    lcd.print(attempts + 1);
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi connected!");
    Serial.print("IP address: ");
    Serial.println(WiFi.localIP());
    
    lcd.clear();
    lcd.print("WiFi Connected!");
    lcd.setCursor(0, 1);
    lcd.print(WiFi.localIP());
    beep(200);
    delay(2000);
  } else {
    Serial.println("\nWiFi connection failed!");
    lcd.clear();
    lcd.print("WiFi Failed!");
    lcd.setCursor(0, 1);
    lcd.print("Check settings");
    errorFeedback();
    delay(3000);
  }
}

// ===== NFC UID TO STRING =====
String uidToString(uint8_t* uid, uint8_t uidLength) {
  String uidString = "";
  for (uint8_t i = 0; i < uidLength; i++) {
    if (i > 0) uidString += ":";
    if (uid[i] < 0x10) uidString += "0";
    uidString += String(uid[i], HEX);
  }
  uidString.toUpperCase();
  return uidString;
}

// ===== SEND TAP TO BACKEND =====
bool sendTapToBackend(String nfcId) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi not connected!");
    return false;
  }

  HTTPClient http;
  http.begin(API_URL);
  http.addHeader("Content-Type", "application/json");
  http.setTimeout(10000);  // 10 second timeout

  // Create JSON payload
  StaticJsonDocument<200> doc;
  doc["nfcId"] = nfcId;
  doc["busId"] = BUS_ID;
  
  String jsonPayload;
  serializeJson(doc, jsonPayload);

  Serial.println("Sending to backend:");
  Serial.println(jsonPayload);

  int httpResponseCode = http.POST(jsonPayload);

  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.print("HTTP Response code: ");
    Serial.println(httpResponseCode);
    Serial.print("Response: ");
    Serial.println(response);

    // Parse JSON response
    StaticJsonDocument<1024> responseDoc;
    DeserializationError error = deserializeJson(responseDoc, response);

    if (error) {
      Serial.print("JSON parsing failed: ");
      Serial.println(error.c_str());
      http.end();
      return false;
    }

    String action = responseDoc["action"] | "ERROR";
    String message = responseDoc["message"] | "Unknown error";
    String passengerName = responseDoc["passenger"]["name"] | "Passenger";
    float fare = responseDoc["fare"] | 0.0;
    float balance = responseDoc["currentBalance"] | responseDoc["remainingBalance"] | 0.0;

    // Display result on LCD
    if (action == "BOARD") {
      lcd.clear();
      lcd.print("Welcome!");
      lcd.setCursor(0, 1);
      lcd.print(passengerName.substring(0, 16));
      successFeedback();
      delay(2000);
      
      lcd.clear();
      lcd.print("Balance:");
      lcd.setCursor(0, 1);
      lcd.print("NPR ");
      lcd.print(balance, 2);
      delay(2000);
      
    } else if (action == "EXIT") {
      lcd.clear();
      lcd.print("Goodbye!");
      lcd.setCursor(0, 1);
      lcd.print(passengerName.substring(0, 16));
      successFeedback();
      delay(2000);
      
      lcd.clear();
      lcd.print("Fare: NPR ");
      lcd.print(fare, 2);
      lcd.setCursor(0, 1);
      lcd.print("Balance: ");
      lcd.print(balance, 2);
      delay(3000);
      
    } else {
      // Error
      lcd.clear();
      lcd.print("Error!");
      lcd.setCursor(0, 1);
      lcd.print(message.substring(0, 16));
      errorFeedback();
      delay(3000);
    }

    http.end();
    return true;

  } else {
    Serial.print("HTTP Error code: ");
    Serial.println(httpResponseCode);
    http.end();
    return false;
  }
}

// ===== SETUP =====
void setup() {
  Serial.begin(115200);
  Serial.println("ESP32 NFC Tap-to-Ride System Starting...");

  // Initialize pins
  pinMode(BUZZER_PIN, OUTPUT);
  digitalWrite(BUZZER_PIN, LOW);

  // Initialize LCD
  lcd.begin(16, 2);
  lcd.clear();
  lcd.print("NFC Tap System");
  lcd.setCursor(0, 1);
  lcd.print("Initializing...");
  beep(100);
  delay(1000);

  // Connect to WiFi
  connectWiFi();

  // Initialize I2C for PN532
  Wire.begin(PN532_SDA, PN532_SCL);
  
  // Initialize PN532
  Serial.println("Initializing PN532...");
  nfc.begin();
  
  uint32_t versiondata = nfc.getFirmwareVersion();
  if (!versiondata) {
    Serial.println("PN532 not found!");
    lcd.clear();
    lcd.print("NFC Error!");
    lcd.setCursor(0, 1);
    lcd.print("Check wiring");
    while (1) {
      beep(100);
      delay(1000);
    }
  }
  
  Serial.print("Found PN532 chip version: ");
  Serial.println((versiondata >> 24) & 0xFF, HEX);
  
  // Configure PN532 to read RFID tags
  nfc.SAMConfig();

  lcd.clear();
  lcd.print("System Ready!");
  lcd.setCursor(0, 1);
  lcd.print("Tap your card");
  beep(200);
  delay(100);
  beep(200);
  
  Serial.println("System ready! Waiting for NFC card...");
}

// ===== MAIN LOOP =====
void loop() {
  uint8_t uid[7];
  uint8_t uidLength;

  // Check for NFC card
  if (nfc.readPassiveTargetID(PN532_MIFARE_ISO14443A, uid, &uidLength, 100)) {
    Serial.println("\n=== NFC Card Detected ===");
    
    // Convert UID to string
    String nfcId = uidToString(uid, uidLength);
    
    Serial.print("UID: ");
    Serial.println(nfcId);
    Serial.print("UID Length: ");
    Serial.print(uidLength);
    Serial.println(" bytes");

    // Display on LCD
    lcd.clear();
    lcd.print("Card Detected!");
    lcd.setCursor(0, 1);
    lcd.print(nfcId.substring(0, 16));
    beep(100);
    delay(1000);

    // Show processing message
    lcd.clear();
    lcd.print("Processing...");
    lcd.setCursor(0, 1);
    lcd.print("Please wait");

    // Send to backend
    bool success = sendTapToBackend(nfcId);

    if (!success) {
      Serial.println("Failed to send tap to backend");
      lcd.clear();
      lcd.print("Server Error");
      lcd.setCursor(0, 1);
      lcd.print("Try again");
      errorFeedback();
      delay(2000);
    }

    // Wait for card to be removed
    lcd.clear();
    lcd.print("Remove card");
    while (nfc.readPassiveTargetID(PN532_MIFARE_ISO14443A, uid, &uidLength, 100)) {
      delay(100);
    }

    // Ready for next card
    lcd.clear();
    lcd.print("System Ready!");
    lcd.setCursor(0, 1);
    lcd.print("Tap your card");
    
    Serial.println("=== Ready for next card ===\n");
    delay(500);
  }

  // Check WiFi connection
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi disconnected! Reconnecting...");
    connectWiFi();
  }

  delay(100);
}
