
//  Imports
const http2 = require('http2');
const fs = require('fs');
const Path = require('path');
const Mime = require('mime');
const dir = require('node-dir');
const log4js = require('log4js');
const FILENAME = Path.basename(__filename)

//  Load ArgV
const optionDefinitions = [
    { name: 'key', alias: 'k', type: String },
    { name: 'cert', alias: 'c', type: String },
    { name: 'debug', alias: 'd', type: Boolean },
    { name: 'pubpath', type: String, multiple: false, defaultOption: true, defaultValue: "../public" },
    { name: 'port', alias: 'p', type: Number },
    { name: 'server-push', type: Boolean },
    { name: 'early-hints', type: Boolean },
    { name: 'allowHTTP1', type: Boolean, defaultValue: false },
    { name: 'log', type: String },
    { name: 'use-br-if-available', type: String, defaultValue: false },
  ]
const commandLineArgs = require('command-line-args');
const runOpts = commandLineArgs(optionDefinitions)

const exec_path = runOpts.pubpath;
const execModeString = runOpts.debug?'DEBUG':'PRODUCTION';

const logger = log4js.getLogger();
log4js.configure({
    appenders: {
        logfile: { type: 'file', filename: Path.join('log', `${FILENAME}-${Date.now()}-${execModeString}.log`) },
        console: { type: 'console' },
    },
    categories: {
        default: { appenders: ['logfile', 'console'], level: 'INFO' },
    }
});
logger.info(`Starting ${FILENAME} in ${execModeString} mode.`);

const port = runOpts.port || 8080;
const serverOpts = {
  allowHTTP1: runOpts.allowHTTP1 
}

var logStream;
if (runOpts.log === "simple") {
  logStream = function (headers, socket) {
    setTimeout((headers, socket) => {
      logger.info(headers[HTTP2_HEADER_METHOD], headers[HTTP2_HEADER_PATH])
    }, 0, headers, socket);
  };
} else if (runOpts.log === "verbose") {
  logStream = (headers, socket) => {
    setTimeout((headers, socket) => {
      logger.info(
        `${socket.remoteFamily}, ${socket.remoteAddress}, ${socket.remotePort}, ${headers[HTTP2_HEADER_METHOD]} '${headers[HTTP2_HEADER_PATH]}', ${headers[http2.constants.HTTP2_HEADER_REFERER]}, '${headers[http2.constants.HTTP2_HEADER_USER_AGENT]}'`
      );
    }, 0, headers, socket );
  };
    // + headers[http2.constants.HTTP2_HEADER]
    // +` - pushList[reqPath]: ${pushList[reqPath]}`
} else {
  logStream = () => {};
}

let useSecure = false;
if (runOpts.key && runOpts.cert) {
  serverOpts.key = fs.readFileSync(runOpts.key);
  serverOpts.cert = fs.readFileSync(runOpts.cert);
  useSecure = true;
  logger.info("Key and Cert Loaded. Running server with encryption enabled.");
} else if (runOpts.key || runOpts.cert) {
  logger.warn(`CommandLineArguments Error: A ${runOpts.key?"key":"cert"} was specified, but a ${runOpts.key?"cert":"key"} was not. In order to enable SSL/TLS, both must be specified. Starting server without SSL/TLS.`);
} else {
  logger.info("Key and Cert Unspecified. Running server without encryption.");
}

const files = loadFiles();
var dirmap;
loadDirMap();
const { 
  HTTP2_HEADER_METHOD,
  HTTP2_HEADER_PATH,
  HTTP2_HEADER_STATUS,
  HTTP2_HEADER_CONTENT_TYPE,
  HTTP2_HEADER_LINK,
  HTTP2_HEADER_ACCEPT_ENCODING,
  HTTP2_HEADER_CONTENT_LENGTH,
  HTTP2_HEADER_LAST_MODIFIED,
  HTTP2_HEADER_CACHE_CONTROL,
  HTTP2_HEADER_CONTENT_ENCODING
} = http2.constants;
//  Create server
const server = useSecure ? http2.createSecureServer(serverOpts) : http2.createServer(serverOpts);

// server.on("request", ()=>{
//   console.info("Request Received");
// })
//  Handle Errors
server.on('error', (err) => logger.error(err));

//  Handle streams (requests are streams)
server.on('stream', (stream, headers) => {
    // stream is a Duplex
    const method = headers[HTTP2_HEADER_METHOD];
    const path = headers[HTTP2_HEADER_PATH];
    const socket = stream.session.socket;
    const encodings = headers[HTTP2_HEADER_ACCEPT_ENCODING];
    // stream.respond({
    //   'content-type': 'text/html; charset=utf-8',
    //   ':status': 200
    // });
    // stream.end(`<h1>Success!</h1><p>You are viewing ${headers[HTTP2_HEADER_PATH]}<p>`);
    // return;
    // Resolve file from :path for serving static content
    // if (method === 'GET') {
    // TODO - Use this vvv when done testing speed.
    // let reqPath;
    // //Handle SubDirs
    // const lstDirs = ['/dnd/']
    // const matchDir = (path, dir) => {
    //   if (path.includes(dir)) {
    //     reqPath = /*path.replace(dir, '')*/`/html${path}.html`;
    //   }
    // }
    // //Get file from request path
    // switch (path) {
    //   case '/': reqPath = '/html/experimental.html';
    //   break;
    //   case '/modlist': reqPath = '/html/modlist.html';
    //   break;
    //   default: reqPath = path;
    // }
    
    // for (let i=0; i<lstDirs.length; i++) {
    //   matchDir(path, lstDirs[i]);
    // }
    const requestedFile = getFile(path, resolveReqPath(path, encodings));
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
    } else */if (runOpts.debug) {
      try {
        // stream.respondWithFile(requestedFile.relPath, requestedFile.headers);
        // logger.log(requestedFile.absPath);
        resHeaders = requestedFile.headers;
        // resHeaders['charset'] = 'utf-8'
        resHeaders[':status'] = 200;
  
        stream.respond(resHeaders);
        stream.end(requestedFile.data);
  
      } catch (err) {
        logger.error(err);
      }
    } else {
        stream.respondWithFD(requestedFile.fileDescriptor, requestedFile.headers);
        //  push all priority content /*Things we KNOW will be needed by the client.*/
        // if (pushList[reqPath]) {
        //     let pathPushList = pushList[reqPath];
        //     for (let i=0; i<pathPushList.length; i++) {
        //         pushFile(stream, pathPushList[i]);

        //         // logger.log('push: ', pathPushList[i]);
        //     }
        // }
        stream.end();
    }

    
    logStream(headers, socket);
  
});

server.listen(port);
logger.info(`'${FILENAME}' is listening on port ${port}`);


function loadFiles() {
  const files = new Map();
  logger.info("Load Site Files..");
  
  dir.files(exec_path, (err, arrFilePaths) => {
    if (arrFilePaths) {
      arrFilePaths.forEach(preloadFiles);
    } else {
      logger.warn(`No files found in pubpath '${exec_path}'. Ensure that the path to the directory is correct and that the directory is not empty.`)
    }
  });
  
  function preloadFiles(filePath) {
      if (!filePath.includes("git")) {
          const relFilePath = Path.relative(exec_path, filePath).replace('\\', '/');
          const fileDescriptor = fs.openSync(filePath, "r");
          const stat = fs.fstatSync(fileDescriptor);
          const contentType = Mime.getType(relFilePath);
          const headers = {
              "content-length": stat.size,
              "last-modified": stat.mtime.toUTCString(),
              "content-type": contentType,
          };
          if (runOpts['early-hints']) {
              console.log(relFilePath);
              if (pushList[relFilePath]) {
                  pList = pushList[relFilePath]
                  linkHeaders = [];
                  // Add 'Link' headers for all files specified in dirmap json file.
                  for(let i=0; i<pList.length; i++) {
                      linkHeaders.push(`<${pList[i].path}>; rel="${pList[i].rel}"${pList[i].as?'; as="'+pList[i].as+'"':''}${pList[i].crossorigin?'; crossorigin="anonymous"':''}`);
                  }
                  headers[HTTP2_HEADER_LINK] = linkHeaders;
              }
          }

          if (runOpts.debug){
              fs.closeSync(fileDescriptor);
              const fileContents = fs.readFileSync(filePath, { flag: 'r' });
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
              //TODO - Implement this properly
              //TODO ...(So that there is a compressed and uncompressed vers of each...
              //TODO ...and it chooses which to use dynamically, based on the request's "AcceptEncoding" header)
              // if (!useDebugPath && (
              //     contentType === 'application/javascript' 
              //     || contentType === 'text/javascript' 
              //     || contentType === 'text/css' 
              //     || contentType === 'text/html' 
              //     || contentType === 'application/json')) {
              //     headers["content-encoding"] = "br";
              // }
              
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

function loadDirMap() {
  const dirmappath = 'http2-dirmap.json';
  logger.info("Load dirmap...");
  let dirmapjson;
  try {
    if(fs.existsSync(dirmappath)) {
      dirmapjson = JSON.parse(fs.readFileSync(dirmappath));
      updateDirMap(dirmapjson);
      logger.info("Successfully loaded dirmap.");
    } else {
        updateDirMap();
    }
  } catch (err) {
    logger.error("Unknown Error: Could not load dirmap.");
    logger.error(err);
  }
};

function resolveReqPath(path, encodings) {
  // Raw Path Resolution:
  return Path.join(exec_path, path);
}

function dirmapGet(path, ) {
  let fdirs = Path.dirname(path).split(Path.sep)

  return dirmapResolvePath(dirmap, fdirs)
}
function dirmapResolvePath(cDirObj, subdirs) {
  nDirObj = cDirObj[subdirs[0]];
  if (nDirObj)
    return dirmapResolvePath(nDirObj, subdirs.slice(1))
  else return cDirObj;
}

function getFile(reqPath, path) {
  let out;
  try {
    let relPath = Path.relative("../public", path);
    let fileName = Path.basename(path)
    if (fileName === '' || fileName === 'public')
      fileName = reqPath; //In theory this should only happen for '/'
    let fileInfo = dirmapGet(relPath)[fileName];
    let file;
    if (fileInfo.alias) {
      logger.info(`using alias '${fileInfo.alias} for '${reqPath}'`);
      file = files.get("/"+fileInfo.alias);
      
      fileInfo = dirmapGet(fileInfo.alias)[Path.basename(fileInfo.alias)]
      // return getFile("/"+fileInfo.alias, "/"+fileInfo.alias);
    } else {
      file = files.get(reqPath);
    }
    out = { 
      headers: fileInfo.headers,
      data: (runOpts['use-br-if-available'] && fileInfo['.br']) ? files.get('/'+fileInfo['.br']).data : file.data 
    }
  } catch (err) {
    console.error("Error retrieving file: "+reqPath)
    console.error(err)
  }
  return out;
}

function updateDirMap(existingDirMap=undefined) {
  if (runOpts.debug) {
    if (existingDirMap === undefined) {
      logger.info('No dirmap file was found. Creating default based on supplied pubpath.');
      existingDirMap = {};
    }
    dirmap = existingDirMap;
    dir.files(exec_path, 'all', (err, objPaths) => {
      // console.log(objPaths);
      if (objPaths) {
        const dirs = objPaths.dirs;
        const files = objPaths.files;
        if (dirs) {
          for (let i=0; i<dirs.length; i++) {
            if (filterIgnoreGit(dirs[i])) {
              let fdirs = Path.relative(exec_path, Path.dirname(dirs[i])).split(Path.sep)
              const name = Path.basename(dirs[i]);
              let dir = dirmapResolvePath(dirmap, fdirs);
              dir[name] = dir[name] || {};
            }
          }
        }
        if (files) {
          let brFiles = [];
          for (let i=0; i<files.length; i++) {
            if (filterIgnoreGit(files[i])) {
              const relDirPath = Path.relative(exec_path, Path.dirname(files[i]));
              const relPath = Path.relative(exec_path, files[i]);
              let fdirs = relDirPath.split(Path.sep)
            
              let name = Path.basename(files[i], '.br');
              let dir = dirmapResolvePath(dirmap, fdirs);
              // Add to map if not already there
              dir[name] = dir[name] || { headers: {} }
              
              // Generate/Update certain standard headers
              let fileDescriptor = fs.openSync(files[i], "r");
              let stat = fs.fstatSync(fileDescriptor);
              fs.closeSync(fileDescriptor);

              let contentEncoding;
              if (Path.extname(files[i]) === ".br") {
                dir[name]['.br'] = relPath.replace(/\\/g, '/');
                
                name = Path.basename(files[i]);
                contentEncoding = "br";
              }

              const contentType = Mime.getType(files[i]);
              dir[name] = dir[name] || {};
              headers = dir[name]["headers"] || {};
              headers[HTTP2_HEADER_CONTENT_LENGTH] = stat.size;
              headers[HTTP2_HEADER_LAST_MODIFIED] = stat.mtime.toUTCString();
              headers[HTTP2_HEADER_CONTENT_TYPE] = headers[HTTP2_HEADER_CONTENT_TYPE] || contentType;
              dir[name]["headers"] = headers;
              if (contentEncoding) {
                headers[HTTP2_HEADER_CONTENT_ENCODING] = contentEncoding;
              }
              if (false && contentType != 'text/html') {
                headers[HTTP2_HEADER_CACHE_CONTROL] = `max-age=${86400*365}`;
              } else {
                headers[HTTP2_HEADER_CACHE_CONTROL] = `max-age=${0}`;
              }


            }
          }
        }
      } else {
        logger.warn(`No files found in pubpath '${exec_path}'. Ensure that the path to the directory is correct and that the directory is not empty.`)
      }
      // console.log(dirmap);
      fs.writeFileSync("http2-dirmap.json", JSON.stringify(dirmap, null, 2), encoding="utf8", flag='w+');
    });
  }

}

function filterIgnoreGit (path) {
  if (path.includes("git"))
      return false;
  return true;
}
