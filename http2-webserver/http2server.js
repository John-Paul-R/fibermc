//  ArgVars
var argv = process.argv.slice(2);
const isDebug = argv.includes('debug');
const isProduction = argv.includes('production')
// const reExecPath = /(?<=\/)[\w\d]*\.js/g;
const execModeString = isDebug?'DEBUG':'BUILT';
//  Imports
const port = 8080;
const http2 = require('http2');
const fs = require('fs');
const Path = require('path');
const Mime = require('mime');
const dir = require('node-dir');
const log4js = require('log4js');

const { 
    HTTP2_HEADER_METHOD,
    HTTP2_HEADER_PATH,
    HTTP2_HEADER_STATUS,
    HTTP2_HEADER_CONTENT_TYPE,
    HTTP2_HEADER_LINK
} = http2.constants;


const reFileName = /(?<=\/)[\w\d]*\.js/g;
const FILENAME = Path.basename(__filename);//__filename.match(reFileName)[0];

const logger = log4js.getLogger();
log4js.configure({
    appenders: {
        logfile: { type: 'file', filename: Path.join('./log/', `${FILENAME}-${Date.now()}-${execModeString}.log`) },
        console: { type: 'console' },
    },
    categories: {
        default: { appenders: ['logfile', 'console'], level: 'INFO' },
    }
});

logger.info(`Starting http2server in ${execModeString} mode.`);

const debug_path = Path.join(__dirname, '../public_src');
const built_path = Path.join(__dirname, '../public');

var exec_path;
const useDebugPath = isDebug;
if (useDebugPath) {
    exec_path = debug_path;
} else {
    exec_path = built_path;
}
exec_path = built_path;
console.log("exec path: " + exec_path);
//  Load map of request paths and the files to push in response to them
const pushList = getPriorityContentList();
//  Preload File Descriptors for Content Files
const contentFiles = getFiles();

//  Load SSL
const options = {
    key: fs.readFileSync(__dirname + '/server.key'),
    cert:  fs.readFileSync(__dirname + '/server.crt'),
    allowHTTP1: true
}

//  Create server
const server = http2.createSecureServer(options);

//  Handle Errors
server.on('error', (err) => console.error(err));

//  Handle streams (requests are streams)
server.on('stream', (stream, headers) => {
    // stream is a Duplex
    const method = headers[HTTP2_HEADER_METHOD];
    const path = headers[HTTP2_HEADER_PATH];
    const socket = stream.session.socket;
    
    // Resolve file from :path for serving static content
    // if (method === 'GET') {
    // TODO - Use this vvv when done testing speed.
    let reqPath;// = path === '/' ? '/html/index.html' : path;
	//Handle SubDirs
	const lstDirs = ['/dnd/']
	const matchDir = (path, dir) => {
		if (path.includes(dir)) {
			reqPath = /*path.replace(dir, '')*/`/html${path}.html`;
		}
	}//            <p>Because CurseForge refuses to make their search & filter functions usable...</p>

	//Get file from request path
	switch (path) {
		case '/': reqPath = '/html/experimental.html';
		break;
		case '/modlist': reqPath = '/html/modlist.html';
        break;
        case '/debug/nikkyGQLsuccess.json': reqPath = '/debug/NikkyGQLsuccess0.json';
		break;

		default: {
            if (path.endsWith('.html')){
                reqPath = '/html' + path;
            } else {
                reqPath = path;
            }
        }
	}
	
	for (let i=0; i<lstDirs.length; i++) {
		matchDir(reqPath, lstDirs[i]);
	}
    const requestedFile = contentFiles.get(reqPath);
    if (!requestedFile) {
        stream.respond({
            'content-type': 'text/html; charset=utf-8',
            ':status': 404
        });
        stream.end('<h1>HTTP Error 404 - Requested file not found.</h1>');
        return;
    }
    //  Send response to the actual request
    /*if (isProduction) {
        if (pushList[reqPath]) {
            // stream.respond({
            //     ':status' : 103,
            //     // 'Link': pushList[reqPath]
            // })            
            // stream.additionalHeaders({
            //     ':status' : 103,
            //     'link': requestedFile.headers[HTTP2_HEADER_LINK]
            //   });
        }
        stream.respondWithFD(requestedFile.fileDescriptor, requestedFile.headers);
    } else */if (isDebug) {
        // stream.respondWithFile(requestedFile.relPath, requestedFile.headers);
        try {
            console.log(requestedFile.absPath);
            stream.respond(requestedFile.headers);
            stream.end(requestedFile.data);
        } catch (err) {
            console.error(err);
        }

    } else {
        stream.respondWithFD(requestedFile.fileDescriptor, requestedFile.headers);
        //  push all priority content /*Things we KNOW will be needed by the client.*/
        // if (pushList[reqPath]) {
        //     let pathPushList = pushList[reqPath];
        //     for (let i=0; i<pathPushList.length; i++) {
        //         pushFile(stream, pathPushList[i]);

        //         // console.log('push: ', pathPushList[i]);
        //     }
        // }
        stream.end();
    }

    logger.info(
        `${socket.remoteFamily}, ${socket.remoteAddress}`
        +`, ${socket.remotePort}`
        +`, ${method} '${path}'`
        // + headers[http2.constants.HTTP2_HEADER]
        +`, ${headers[http2.constants.HTTP2_HEADER_REFERER]}`
        +`, '${headers[http2.constants.HTTP2_HEADER_USER_AGENT]}'`
        +` - pushList[reqPath]: ${pushList[reqPath]}`
    );

});

server.listen(port);
logger.info(`'http2server' is listening on port ${port}`);


//  Functions
//      Utility
//          Load File Descriptors
function getFiles() {
    const files = new Map();
    console.log("getFiles start");
    
    dir.files(exec_path, (err, arrFilePaths) => arrFilePaths.forEach(preloadFiles));
    
    function preloadFiles(filePath) {
        if (!filePath.includes("git")){
            const relFilePath = Path.relative(exec_path, filePath).replace('\\', '/');
            const fileDescriptor = fs.openSync(filePath, "r");
            const stat = fs.fstatSync(fileDescriptor);
            const contentType = Mime.getType(relFilePath);
            const headers = {
                "content-length": stat.size,
                "last-modified": stat.mtime.toUTCString(),
                "content-type": contentType,
            };
            if (isProduction) {
                console.log(relFilePath);
                if (pushList['/'+relFilePath]) {
                    pList = pushList['/'+relFilePath]
                    linkHeaders = [];
                    for(let i=0; i<pList.length; i++) {
                        linkHeaders.push(`<${pList[i].path}>; rel="${pList[i].rel}"${pList[i].as?'; as="'+pList[i].as+'"':''}${pList[i].crossorigin?'; crossorigin="anonymous"':''}`);
                    }
                    headers[HTTP2_HEADER_LINK] = linkHeaders;
                    // headers["content-encoding"] = "gzip"

                }

            }

            if (isDebug){
                
                fs.closeSync(fileDescriptor);
                const fileContents = fs.readFileSync(filePath);
                files.set(`/${relFilePath}`, {
                    absPath: filePath,
                    data: fileContents,
                    fileName: relFilePath,
                    headers: headers
                });
                console.info(`File registered: /${relFilePath}`)
            } else {
                
                if (contentType != 'text/html') {
                    headers["cache-control"] = `max-age=${86400*365}`;
                }
                //  Because these types of files are compressed with brotli...
                if (!useDebugPath && (
                    contentType === 'application/javascript' 
                    || contentType === 'text/javascript' 
                    || contentType === 'text/css' 
                    || contentType === 'text/html' 
                    || contentType === 'application/json')) {
                    headers["content-encoding"] = "br";
                }
                
                files.set(`/${relFilePath}`, {
                    fileName: relFilePath,
                    fileDescriptor,
                    headers: headers
                });
                console.info(`File loaded: /${relFilePath}`)
                // console.log(files.get(`/${fileName}`));
            }
            
        }
    }
    return files;
};

//      Load list of files to http2 push with different requests
function getPriorityContentList() {
    console.info("getPriorityContentList start");
    return JSON.parse(fs.readFileSync('./http2-pushfiles.json'));
};

//      http2 pushFile
var pushFile;
if (isDebug) {
    pushFile = (stream, path)=>{
        const file = contentFiles.get(path);
        stream.pushStream({ [HTTP2_HEADER_PATH]: path }, (err, pushStream) => {
            pushStream.on('error', (err) => {
                const isRefusedStream = (
                    err.code === 'ERR_HTTP2_STREAM_ERROR'
                    && pushStream.rstCode === http2.constants.NGHTTP2_REFUSED_STREAM
                );
                if (!isRefusedStream)
                  throw err;
            });
            if (err) {
                console.error("PushStream Error: ", err);
                return;
            }
            console.info("Debug Push Path: " + path);
            pushStream.respond(file.headers);
            pushStream.end(file.data);
        })
    };
} else {
    pushFile = (stream, path)=>{
        const file = contentFiles.get(path);
        stream.pushStream({ [HTTP2_HEADER_PATH]: path }, (err, pushStream) => {
            pushStream.on('error', (err) => {
                const isRefusedStream = (
                    err.code === 'ERR_HTTP2_STREAM_ERROR'
                    && pushStream.rstCode === http2.constants.NGHTTP2_REFUSED_STREAM
                );
                if (!isRefusedStream)
                  throw err;
            });
            if (err) {
                console.error("PushStream Error: ", err);
                return;
            }
            console.info("Push Path: " + path);
            pushStream.respondWithFD(file.fileDescriptor, file.headers);
        })
    };
}


// Old Pushfiles
// { "rel": "preload", "path": "data/AtlasNode+WorldAreas_Itemized-1594755436.json", "as": "fetch", "crossorigin": "anonymous" },
// { "rel": "preload", "path": "/pixi/node_spritesheet-4qLL2.json", "as": "fetch", "crossorigin": "anonymous" },
