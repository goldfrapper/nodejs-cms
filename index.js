/**
 * Project: NodeJS-CMS
 *
 * (c) GPL-3.0 license
 **/

const http = require('http');
const {System} = require(__dirname + '/lib/system.js');

System.runTests();

const {WebService} = System.require('webservice');

const hostname = System.tier.hostname;
const port = System.tier.port;

const server = http.createServer((req, res) => {
  const service = WebService.createService(req, res);
  service.run();
});

server.listen(port, hostname, () => {
  System.log(`Server running at http://${hostname}:${port}/`,'SYS');
});
process.on('SIGTERM', ()=>{
  server.close(()=>{ console.log('Process terminated') })
});
