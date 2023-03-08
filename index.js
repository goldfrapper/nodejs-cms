/**
 * Project: NodeJS-CMS
 *
 * (c) GPL-3.0 license
 **/

const http = require('http');
const {WebService} = require(__dirname + '/lib/webservice.js');

// TODO Settings
const hostname = '127.0.0.1';
const port = 3000;

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
