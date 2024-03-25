const MongoClient    = require('mongodb').MongoClient;
const db_config = require('../config/config');
const client = new MongoClient(db_config.url);


client.connect().then(r => {
    console.log('Connected successfully to mongo');
});
async function addDevice(data) {
    let result = await checkDevice(data);
    console.log(result ? 'Device already exists': 'Device not found');
    if (!result) {
        await saveDevice(data);
        result = false;
    }
    return result;
}

async function getDevices() {
    const db = client.db('smarthome');
    const collection = db.collection('sensors_config');
    const result = await collection.find({}).toArray();
    return result;
}
async function getDeviceIDs() {
    const db = client.db('smarthome');
    const collection = db.collection('sensors_config');
    const result = await collection.find({},{projection:{device_id:1,_id:0}}).toArray();
    return result;
}

async function getDevice(id) {
    const db = client.db('smarthome');
    const collection = db.collection('sensors_config');
    const result = await collection.findOne({"device_id": id});
    return result;
}

async function getDeviceByTopic(topic) {
    const db = client.db('smarthome');
    const collection = db.collection('sensors_config');
}

async function updateDevice(id, data) {
    const db = client.db('smarthome');
    const collection = db.collection('sensors_config');
    const result = await collection
        .updateOne({"id": id}, {$set: data});
    return result.ok === 1;
}

async function deleteDevice(id) {
    const db = client.db('smarthome');
    const collection = db.collection('sensors_config');
    const result = await collection
        .deleteOne({"id": id});
    return result.ok === 1;
}

async function getDeviceData(id) {
    const db = client.db('smarthome');
    const collection = db.collection('sensors_data');
    const result = await collection
        .find({"device_id": id})
        .sort({_id: -1})
        .limit(1)
        .toArray();
    return result;
}

async function getDeviceDataHistory(id) {
    const db = client.db('smarthome');
    const collection = db.collection('sensors_data');
    const result = await collection
        .find({"device_id": id})
        .project({"value":1})
        .limit(20)
        .toArray();
    return result;
}

async function getDevicesData(){
    const db = client.db('smarthome');
    const collection = db.collection('sensors_data');
    const result = await collection
        .find({})
        .toArray();
    return result;
}

async function updateDeviceData(deviceID, data) {
    const db = client.db('smarthome');
    const collection = db.collection('sensors_data');
    const result = await collection
        .updateOne({"device_id": deviceID}, {$set: {value: data}});
    return result.ok === 1;

}

async function saveDeviceData(deviceID,data,topic) {
    const db = client.db('smarthome');
    const collection = db.collection('sensors_data');
    const newdata = {
        "device_id": deviceID,
        "topic": topic,
        "value": data,
    }
    const result = await collection.insertOne(newdata);
    return result.ok === 1;
}

async function deleteOldTemperatureData(deviceID) {
    const db = client.db('smarthome');
    const collection = db.collection('sensors_data');
    const count_data = await collection.countDocuments({"device_id":deviceID,"topic": "temperature"});
    if(count_data >= 20){
        const docs = await collection.find({"device_id":deviceID,"topic": "temperature"}, {_id: 1})
            .limit(10)
            .sort({_id:1})
            .toArray();
        const result = docs.map(function(doc) { return doc._id; });
        await collection.deleteMany({_id: {$in: result}});
    }
}


async function checkDevice(data) {
    const db = client.db('smarthome');
    const collection = db.collection('sensors_config');
    // collection.findOne({"id": data.id}).then(r => {
    //     if (r !== null) {
    //         console.log('Device already exists');
    //         return true;
    //     } else {
    //         console.log('Device not found');
    //         return false;
    //     }
    // }).then(r => {
    //     console.log("1. "+r);
    //     return r;
    // });
    const result = await collection.findOne({"device_id": data.device_id});
    console.log('Checking device');
    return result !== null;
}

async function saveDevice(data) {
    const db = client.db('smarthome');
    const collection = db.collection('sensors_config');
    // collection.insertOne(data).then(r => {
    //     console.log('Device saved');
    //     return true;
    // }).then(r => {
    //     console.log("2. "+r);
    //     return r;
    // });
    const result = await collection.insertOne(data);
    console.log('Saving device');
    return result;
}

module.exports = {client, addDevice,saveDeviceData, getDevices, getDevice, updateDevice, deleteDevice, getDeviceData, getDeviceDataHistory, updateDeviceData,getDeviceIDs,deleteOldTemperatureData,getDevicesData};
