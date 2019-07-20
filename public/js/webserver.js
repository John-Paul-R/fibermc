"use strict";
exports.__esModule = true;
var path = require("path");
var express = require('express');
var app = express();
var port = 80;
var root_path = "S:\\Workspaces\\Projects\\Minecraft\\Fabric Modlist Site";
var siteDirName = 'public';
var siteDir = path.join(root_path, siteDirName);
app.use(express.static(siteDir));
app.get('/', function (req, res) { return res.sendFile(path.join(siteDir, 'index.html')); });
app.listen(port, function () { return console.log("webserver.js listening on port " + port + "!"); });
//# sourceMappingURL=webserver.js.map