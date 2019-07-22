import * as path from "path";
import * as util from "util";
import * as express from "express";
import * as fs from 'fs';
import {loadExitHandler} from './exit_handler';
import * as io from 'socket.io';
import * as net from 'net';
import * as log4js from "log4js"
import * as session from 'express-session';
import cookieParser = require('cookie-parser');

var countExpressUse = 0;
export function getCountExpressUse() { return countExpressUse; }

const reFileName = /(?<=\\)[\w\d]*\.js/;
const filename = __filename.match(reFileName)[0];
const root_path = "S:/Workspaces/Projects/Minecraft/Fabric Modlist Site";
const siteDirName = '/public/';
const app = express();
const router = express.Router();
const port = 80;
const siteDir:string = path.join(root_path, siteDirName);
const session_secret:string = fs.readFileSync('session_secret').join("");
const logger = log4js.getLogger();
log4js.configure({
    appenders: {
        logfile: { type: 'file', filename: filename+'.log' },
        console: { type: 'console' },
    },
    categories: {
        default: { appenders: ['logfile', 'console'], level: 'INFO' },
    }
});

logger.info("Loading event handlers:");
logger.info("Loading exitHandler...");
loadExitHandler();
logger.info("exitHandler loaded!");

app.use(express.static(siteDir));
app.use(log4js.connectLogger(logger, {
    level: 'info',
    format: (req, res, format) => format(`:remote-addr - ":method :url HTTP/:http-version" :status :content-length ":referrer" ":user-agent"`)
  }));
app.use(cookieParser());
app.use(session({secret: session_secret}));
app.use((req, res, next) => {
    //logger.info("%s\t-\tFrom: %s\t-\tQuery: %s", req.method, req.ip, req.url);
    countExpressUse += 1;
    next();
});
app.get('/', (req, res) => {
    res.sendFile(path.join(siteDir,'html/index.html'));
});
app.get(/\/test(\/\d*$|\/$|$)/, (req, res, next) => {
    if(req.session.test_page_views) {
        req.session.test_page_views++;
        res.send("You visited test pages " + req.session.test_page_views + " times");
    } else {
        req.session.test_page_views = 1;
        res.send("Welcome to this test page for the first time!");
    }
    next();
});
const server: net.Server = app.listen(port, () => logger.info(filename  + ` is listening on port ${port}!`));
logger.info("Server started!");
// server.on('connection', (socket: net.Socket) => {
//     logger.info('New connection established. RemoteAddress: ' + socket.remoteAddress);
//     sessionConnectionCount += 1;
// })

//const sio: io.Server = io(server);
//const sio = require('socket.io')(server);
// sio.on('connection', (socket: io.Socket) => {
//     logger.info('New connection established. ID: ' + socket.id);
//     sessionConnectionCount += 1;
// });
