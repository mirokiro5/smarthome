const express        = require('express');
const bodyParser     = require('body-parser');
//const db             = require('./config/db');
const app            = express();
const port = 8000;
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");

const homeRouter = require("./routes/homeRouter.js");
const apiRouter = require("./routes/apiRouter.js");

    app.use("/", homeRouter);
    app.use("/api", apiRouter);

    app.listen(port, () => {
        console.log('We are live on ' + port);
    });