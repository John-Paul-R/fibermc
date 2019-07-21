import * as path from "path";
import * as express from "express";
import * as fs from 'fs';
import {loadExitHandler} from './exit_handler';
import * as io from 'socket.io';
import * as net from 'net';


const html = require('html');


var info: string = "[INFO] ";
var warn: string = "[WARN] ";
var err: string = "ERROR ";
console.log(info+"Loading event handlers:");
console.log(info+"Loading exitHandler...");
loadExitHandler();
console.log(info+"exitHandler loaded!");


const app = express();
const router = express.Router();
import * as session from 'express-session';
import cookieParser = require('cookie-parser');
const port = 80;
const root_path = "S:/Workspaces/Projects/Minecraft/Fabric Modlist Site";
const siteDirName = '/public/';
const siteDir:string = root_path+siteDirName;//path.join(root_path, siteDirName);
const session_secret:string = fs.readFileSync('session_secret').join("");

app.use(cookieParser());
app.use(session({secret: session_secret}));

var sessionConnectionCount = 0;
export function getSessionConnectionCount() {
    return sessionConnectionCount;
}

fs.writeFileSync("site_stats.txt", "test string");

app.use(express.static(siteDir));

app.use((req, res, next) => {
    console.log("%s%s\t-\tFrom: %s\t-\tQuery: %s", info, req.method, req.ip, req.url);
    next();
});

app.get('/', (req, res) => {
    // console.log("WE TESTING, BOIS");
    res.sendFile(path.join(siteDir,'html/index.html'));
});

app.get('/test2', function(req: Express.Request, res, next) {
    if(req.session.page_views){
        req.session.page_views++;
        res.send("You visited this page " + req.session.page_views + " times");
     } else {
        req.session.page_views = 1;
        res.send("Welcome to this page for the first time!");
     }
    next();
});
app.get('/test', (req, res, next) => {
    res.send("Test response!");
    next();
});

const server: net.Server = app.listen(port, () => console.log(__filename + ` is listening on port ${port}!`));
console.log("Server started!");
server.on('connection', (socket: net.Socket) => {
    console.log(info+'New connection established. RemoteAddress: ' + socket.remoteAddress);
    sessionConnectionCount += 1;
})

//const sio: io.Server = io(server);
//const sio = require('socket.io')(server);
// sio.on('connection', (socket: io.Socket) => {
//     console.log(info+'New connection established. ID: ' + socket.id);
//     sessionConnectionCount += 1;
// });
