"use strict";
exports.__esModule = true;
var fs = require("fs");
var util = require("util");
function onConnect() {
}
exports.onConnect = onConnect;
function logStats(numConnections) {
    var statsString = util.format('%s, %s\n', process.uptime(), numConnections);
    console.log("[STATS] " + statsString);
    fs.writeFileSync('site_stats.csv', statsString, { flag: 'a' });
}
exports.logStats = logStats;
//# sourceMappingURL=site_stats.js.map