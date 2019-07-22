import {logStats} from './site_stats';
import {getCountExpressUse} from './webserver';

export function loadExitHandler() {
    process.stdin.resume();//so the program will not close instantly

    function exitHandler(options: { cleanup: boolean; exit: boolean; }, exitCode: number) {
        if (options.cleanup) {
            console.log('Attempting cleanup...');

            logStats(getCountExpressUse());

            console.log('Cleanup complete!');
        }
        if (exitCode || exitCode === 0) console.log(exitCode);
        if (options.exit) {
            console.log("Detected app closing.")
            process.exit();
        }
    }
    
    //do something when app is closing
    process.on('exit', exitHandler.bind(null,{cleanup:true}));
    
    //catches ctrl+c event
    process.on('SIGINT', exitHandler.bind(null, {exit:true}));
    
    // catches "kill pid" (for example: nodemon restart)
    process.on('SIGUSR1', exitHandler.bind(null, {exit:true}));
    process.on('SIGUSR2', exitHandler.bind(null, {exit:true}));
    
    //catches uncaught exceptions
    process.on('uncaughtException', exitHandler.bind(null, {exit:true}));
}
