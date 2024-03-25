const express = require("express");
const path = require("path");
const homeRouter = express.Router();
const dbutil = require("../utils/database_util");

homeRouter.get("/about", function (req, res) {
    res.send("О сайте");
});
homeRouter.get("/", async function (req, res) {
    await getDevices(req, res);
});
homeRouter.use(express.static(path.join(__dirname, '../public')));

async function getDevices(req, res) {
    // dbutil.getDevices().then((devices) => {
    //     console.log(devices);
    //     res.render("home.ejs", {
    //         devices: devices
    //     });
    // }).catch((err) => {
    //     res.send("Error: " + err);
    // });
    const devices = await dbutil.getDevices().catch((err) => {console.error(err);} );
    //const devices_data = await dbutil.getDevicesData().catch((err) => {console.error(err);} );
    res.render("home.ejs", {
        devices: devices,
    });
}

module.exports = homeRouter;