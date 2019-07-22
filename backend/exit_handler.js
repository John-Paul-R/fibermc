"use strict";
exports.__esModule = true;
var site_stats_1 = require("./site_stats");
var webserver_1 = require("./webserver");
function loadExitHandler() {
    process.stdin.resume();
    function exitHandler(options, exitCode) {
        if (options.cleanup) {
            console.log('Attempting cleanup...');
            site_stats_1.logStats(webserver_1.getCountExpressUse());
            console.log('Cleanup complete!');
        }
        if (exitCode || exitCode === 0)
            console.log(exitCode);
        if (options.exit) {
            console.log("Detected app closing.");
            process.exit();
        }
    }
    process.on('exit', exitHandler.bind(null, { cleanup: true }));
    process.on('SIGINT', exitHandler.bind(null, { exit: true }));
    process.on('SIGUSR1', exitHandler.bind(null, { exit: true }));
    process.on('SIGUSR2', exitHandler.bind(null, { exit: true }));
    process.on('uncaughtException', exitHandler.bind(null, { exit: true }));
}
exports.loadExitHandler = loadExitHandler;
//# sourceMappingURL=exit_handler.js.map