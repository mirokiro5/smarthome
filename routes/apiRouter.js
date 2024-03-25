const express = require("express");
const db_utils = require("../utils/database_util");
const db = db_utils.client.db('smarthome');
const mqtt = require("../utils/mqtt_util");
const apiRouter = express.Router();

apiRouter.get('/devices/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const details = { 'device_id':id };
    console.log(details);
    db.collection('sensors_config').findOne(details).then(r => {
        console.log(r);
        res.send(r);
    });
});
apiRouter.get('/devices', async (req, res) => {
    db.collection('sensors_config').find({},{ projection: { device_id: 1, _id: 0 } }).toArray().then(r => {
        res.send(r);
    });
});
apiRouter.get('/devices/:id/last_data', (req, res) => {
    const id = parseInt(req.params.id);
    const details = { 'device_id':id };
    db.collection('sensors_data').find({ device_id: id }, {projection:{ value: 1, _id: 0 }}).toArray().then(r => {
        res.send(r);
    });
});
apiRouter.get('/devices/:id/data', (req, res) => {
    const id = parseInt(req.params.id);
    const details = { 'device_id':id };
    db.collection('sensors_data').find({ device_id: id }, {projection:{ value: 1 }}).limit(20).toArray().then(r => {

        //make clean array from r
        let data = [];
        r.forEach(element => {
            data.push({
                'hours': element._id.getTimestamp().getUTCHours(),
                'minutes': element._id.getTimestamp().getUTCMinutes(),
                'value': element.value
            })
        });
        res.send(data);
    });
});
apiRouter.post('/devices/:id/switch', (req, res) => {
    const id = parseInt(req.params.id);
    const value = req.body.value;
    const details = { 'device_id':id };
    const device = db_utils.getDevice(id).then(r => {
        console.log(r);
        if(r.topics.includes('switch')) {
            console.log('device name: ' + r.name);
            mqtt.publish('smarthome/sensors/' + r.name + '_' + id + '/switch', value);
            res.send('Published');
        }
        else {
            res.send('Device cant be switched');
        }
    }).catch(err => {
        console.log(err);
        res.send('Error: ' + err);
    });
});

module.exports = apiRouter;