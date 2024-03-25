const mqtt = require('mqtt')
const db = require('./database_util');
const config = require('../config/config');

const protocol = 'mqtt'
const host = config.mqtt_host
const port = '1883'
const clientId = `mqtt_${Math.random().toString(16).slice(3)}`

const connectUrl = `${protocol}://${host}:${port}`
const topic = 'nodejs/mqtt'
const topic2 = 'smarthome/sensors/#'
const temperature_topic = /smarthome\/sensors\/.*\/temperature/;
const switch_topic = /smarthome\/sensors\/.*\/switch/;

    const client = mqtt.connect(connectUrl, {
        clientId,
        clean: true,
        connectTimeout: 4000,
        //username: 'emqx',
        //password: 'public',
        reconnectPeriod: 1000,
    })

    client.on('connect', (error) => {
        console.log(`MQTT connected to ${connectUrl}`);
        client.subscribe(topic2, {qos: 0});
    })

    client.on('message', async (topic, message) => {
        console.log(`Received message from ${topic}: ${message}`);
        let config_topic = /smarthome\/sensors\/.*\/config/;
        //check if message is empty
        if (message.toString() === '') {
            return;
        }
        if (topic.match(config_topic)) {
            try {
                message = JSON.parse(message.toString());
            }catch(err){
               console.error(err);
            }
            const result = await db.addDevice(message);
            console.log(message.topics);
            if (!result) {
                const deviceID = topic.match(/sensors\/([^\/]+)_(\d+)/)[2];
                console.log(`Device ID: ${deviceID}`);
                for (let sensor of message.topics) {
                    topic = topic.replace('config', sensor);
                    console.log(`Subscribing to ${topic}`);
                    client.subscribe(topic, {qos: 0})
                    switch(sensor) {
                        case 'switch':
                            await db.saveDeviceData(deviceID, false, sensor);
                            break;
                        // default:
                        //     await db.saveDeviceData(deviceID, false, sensor);
                        //     break;
                    }
                }
            }
        }
        else
            if (topic.match(temperature_topic)) {
                console.log(`Temperature: ${message.toString()}`);
                const deviceID = parseInt(topic.match(/sensors\/([^\/]+)_(\d+)/)[2]);
                console.log(`Device ID: ${deviceID}`);
                message = parseFloat(message.toString());
                await db.deleteOldTemperatureData(deviceID);
                await db.saveDeviceData(deviceID,message,"temperature");
            }
        else
            if (topic.match(switch_topic)) {
                message = parseInt(message);
                console.log(`Switch: ${message}`);
                const deviceID = parseInt(topic.match(/sensors\/([^\/]+)_(\d+)/)[2]);
                console.log(`Device ID: ${deviceID}`);
                const device_data_exists =  await db.getDeviceData(deviceID);
                if(device_data_exists.length === 0){
                    await db.saveDeviceData(deviceID,message,"switch");
                }else {
                    await db.updateDeviceData(deviceID, message);
                }
            }
    })

    client.on('error', (error) => {
        console.error(`MQTT error: ${error}`)
    })

    client.on('reconnect', () => {
        console.log('Reconnecting...')
    })

    client.on('close', () => {
        console.log('Disconnected')
    })

    function publish(topic, message) {
        //message = message.toString() === 'true';
        client.publish(topic, message, {qos: 0});
    }
module.exports = {client, publish};