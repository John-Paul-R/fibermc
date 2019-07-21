import * as path from "path";
import * as express from "express";
import * as fs from 'fs';
import * as util from 'util';

export function onConnect() {

}

export function logStats(numConnections: number) {
    var statsString: string = util.format('%s, %s\n', process.uptime(), numConnections);
    console.log("[STATS] " + statsString);
    fs.writeFileSync(
        'site_stats.csv',
        statsString,
        {flag: 'a'}
        /*(err: NodeJS.ErrnoException | null) => {
            console.log("[ERROR] " + err.message + " - Error Code: " + err.code);
        }*/
    );
    
}
