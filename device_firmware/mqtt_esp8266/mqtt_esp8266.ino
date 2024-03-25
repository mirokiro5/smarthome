#include <ESP8266WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>


// Update these with values suitable for your network.

const char* ssid = "ssid";
const char* password = "pass";
const char* mqtt_server = "192.168.1.51";
const char* device_name = "device123";
const int device_id = 123;
char config_topic[30];
char data_topic[30];

WiFiClient espClient;
PubSubClient client(espClient);
unsigned long lastMsg = 0;
#define MSG_BUFFER_SIZE	(50)
char msg[MSG_BUFFER_SIZE];
int value = 0;

void setup_wifi() {

  delay(10);
  // We start by connecting to a WiFi network
  Serial.println();
  Serial.print("Connecting to ");
  Serial.println(ssid);

  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  randomSeed(micros());

  Serial.println("");
  Serial.println("WiFi connected");
  Serial.println("IP address: ");
  Serial.println(WiFi.localIP());
}

void callback(char* topic, byte* payload, unsigned int length) {
  Serial.print("Message arrived [");
  Serial.print(topic);
  Serial.print("] ");
  for (int i = 0; i < length; i++) {
    Serial.print((char)payload[i]);
  }
  Serial.println();

  // Switch on the LED if an 1 was received as first character
  if ((char)payload[0] == '1') {
    digitalWrite(BUILTIN_LED, LOW);   // Turn the LED on (Note that LOW is the voltage level
    // but actually the LED is on; this is because
    // it is active low on the ESP-01)
  } else {
    digitalWrite(BUILTIN_LED, HIGH);  // Turn the LED off by making the voltage HIGH
  }

}

void reconnect() {
  // Loop until we're reconnected
  while (!client.connected()) {
    Serial.print("Attempting MQTT connection...");
    // Create a random client ID
    String clientId = "ESP8266Client-";
    clientId += String(random(0xffff), HEX);
    // Attempt to connect
    if (client.connect(clientId.c_str())) {
      Serial.println("connected");
      // Once connected, publish an announcement...
      client.publish("outTopic", "hello world");
      // ... and resubscribe
      client.subscribe("inTopic");
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" try again in 5 seconds");
      // Wait 5 seconds before retrying
      delay(5000);
    }
  }
  publish_config();
  suscribe_to_data_topic();
}

void publish_config(){
  strcpy(config_topic,"smarthome/sensors/");
  strcat(config_topic,device_name);
  strcat(config_topic,"_");
  char device_id_char[10];
  itoa(device_id,device_id_char,10);
  strcat(config_topic,device_id_char);
  strcat(config_topic,"/config");
  String output;
  //String config_topic = "smarthome/sensors/"+String(device_name)+"_"+String(device_id)+"/config"

  JsonDocument doc;

  doc["device_id"] = device_id;
  doc["name"] = device_name;
  doc["topics"][0] = "switch";

  doc.shrinkToFit();  // optional

  serializeJson(doc, output);
    client.publish(config_topic,output.c_str(),true);
}
void suscribe_to_data_topic(){
  strcpy(data_topic,"smarthome/sensors/");
  strcat(data_topic,device_name);
  strcat(data_topic,"_");
  char device_id_char[10];
  itoa(device_id,device_id_char,10);
  strcat(data_topic,device_id_char);
  strcat(data_topic,"/switch");
  client.subscribe(data_topic);
}

void setup() {
  pinMode(BUILTIN_LED, OUTPUT);     // Initialize the BUILTIN_LED pin as an output
  Serial.begin(115200);
  setup_wifi();
  client.setServer(mqtt_server, 1883);
  client.setCallback(callback);
  
}

void loop() {

  if (!client.connected()) {
    reconnect();
  }
  client.loop();
}
