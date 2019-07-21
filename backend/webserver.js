"use strict";
exports.__esModule = true;
var path = require("path");
var express = require("express");
var fs = require("fs");
var exit_handler_1 = require("./exit_handler");
var html = require('html');
var info = "[INFO] ";
var warn = "[WARN] ";
var err = "ERROR ";
console.log(info + "Loading event handlers:");
console.log(info + "Loading exitHandler...");
exit_handler_1.loadExitHandler();
console.log(info + "exitHandler loaded!");
var app = express();
var router = express.Router();
var session = require("express-session");
var cookieParser = require("cookie-parser");
var port = 80;
var root_path = "S:/Workspaces/Projects/Minecraft/Fabric Modlist Site";
var siteDirName = '/public/';
var siteDir = root_path + siteDirName;
var session_secret = fs.readFileSync('session_secret').join("");
app.use(cookieParser());
app.use(session({ secret: session_secret }));
var sessionConnectionCount = 0;
function getSessionConnectionCount() {
    return sessionConnectionCount;
}
exports.getSessionConnectionCount = getSessionConnectionCount;
fs.writeFileSync("site_stats.txt", "test string");
app.use(express.static(siteDir));
app.use(function (req, res, next) {
    console.log("%s%s\t-\tFrom: %s\t-\tQuery: %s", info, req.method, req.ip, req.url);
    next();
});
app.use('/', function (req, res) {
    res.sendFile(path.join(siteDir, 'html/index.html'));
});
app.get('/test2', function (req, res, next) {
    if (req.session.page_views) {
        req.session.page_views++;
        res.send("You visited this page " + req.session.page_views + " times");
    }
    else {
        req.session.page_views = 1;
        res.send("Welcome to this page for the first time!");
    }
    next();
});
app.get('/test', function (req, res, next) {
    res.send("Test response!");
    next();
});
var server = app.listen(port, function () { return console.log(__filename + (" is listening on port " + port + "!")); });
console.log("Server started!");
server.on('connection', function (socket) {
    console.log(info + 'New connection established. RemoteAddress: ' + socket.remoteAddress);
    sessionConnectionCount += 1;
});
//# sourceMappingURL=webserver.js.map