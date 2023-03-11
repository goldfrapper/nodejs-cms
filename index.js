/**
 * Project: NodeJS-CMS
 *
 * (c) GPL-3.0 license
 **/

const http = require('http');
const {WebService} = require(__dirname + '/lib/webservice.js');
const {System} = require(__dirname + '/lib/system.js');

const hostname = System.tier.hostname;
const port = System.tier.port;

const server = http.createServer((req, res) => {
  const service = WebService.createService(req, res);
  service.run();
});

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});
process.on('SIGTERM', ()=>{
  server.close(()=>{ console.log('Process terminated') })
});
