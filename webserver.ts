
import * as path from "path";

const express = require('express');
const app = express();
const port = 80;
const root_path = "S:\\Workspaces\\Projects\\Minecraft\\Fabric Modlist Site";
const siteDirName = 'public';
const siteDir = path.join(root_path, siteDirName);

app.use(express.static(siteDir));

app.get('/', (req: any, res: {
    sendFile: (fileName: string) => void; }) => res.sendFile(path.join(siteDir, 'index.html')));

app.listen(port, () => console.log(`webserver.js listening on port ${port}!`));
