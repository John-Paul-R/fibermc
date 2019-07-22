"use strict";
exports.__esModule = true;
var path = require("path");
var express = require("express");
var fs = require("fs");
var exit_handler_1 = require("./exit_handler");
var log4js = require("log4js");
var session = require("express-session");
var cookieParser = require("cookie-parser");
var countExpressUse = 0;
function getCountExpressUse() { return countExpressUse; }
exports.getCountExpressUse = getCountExpressUse;
var reFileName = /(?<=\\)[\w\d]*\.js/;
var filename = __filename.match(reFileName)[0];
var root_path = "S:/Workspaces/Projects/Minecraft/Fabric Modlist Site";
var siteDirName = '/public/';
var app = express();
var router = express.Router();
var port = 80;
var siteDir = path.join(root_path, siteDirName);
var session_secret = fs.readFileSync('session_secret').join("");
var logger = log4js.getLogger();
log4js.configure({
    appenders: {
        logfile: { type: 'file', filename: filename + '.log' },
        console: { type: 'console' }
    },
    categories: {
        "default": { appenders: ['logfile', 'console'], level: 'INFO' }
    }
});
logger.info("Loading event handlers:");
logger.info("Loading exitHandler...");
exit_handler_1.loadExitHandler();
logger.info("exitHandler loaded!");
app.use(express.static(siteDir));
app.use(log4js.connectLogger(logger, {
    level: 'info',
    format: function (req, res, format) { return format(":remote-addr - \":method :url HTTP/:http-version\" :status :content-length \":referrer\" \":user-agent\""); }
}));
app.use(cookieParser());
app.use(session({ secret: session_secret }));
app.use(function (req, res, next) {
    countExpressUse += 1;
    next();
});
app.get('/', function (req, res) {
    res.sendFile(path.join(siteDir, 'html/index.html'));
});
app.get(/\/test(\/\d*$|\/$|$)/, function (req, res, next) {
    if (req.session.test_page_views) {
        req.session.test_page_views++;
        res.send("You visited test pages " + req.session.test_page_views + " times");
    }
    else {
        req.session.test_page_views = 1;
        res.send("Welcome to this test page for the first time!");
    }
    next();
});
var server = app.listen(port, function () { return logger.info(filename + (" is listening on port " + port + "!")); });
logger.info("Server started!");
//# sourceMappingURL=webserver.js.map