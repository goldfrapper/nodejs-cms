/**
 * Project: NodeJS-CMS
 *
 * (c) GPL-3.0 license
 **/
const {WebService} = require(__dirname + '/webservice.js');


class Resource extends WebService
{
  run()
  {
    let http_body;
    const fs = require('fs');

    let path = this.path;
    let p = this.url.pathname;

    if(p.indexOf('bootstrap') != -1) {
      path += 'node_modules/bootstrap/dist/';
      path += p.substring(p.lastIndexOf('.')+1);
      path += p.substring('/resources'.length);
    } else {
      path += p;
    }

    // Get extension => mimetype
    var mime = 'text/plain';
    switch(this.req.url.slice(-3)) {
        case '.js': mime = 'text/javascript'; break;
        case 'css': mime = 'text/css'; break;
        case 'png': mime = 'image/png'; break;
        case 'svg': mime = 'image/svg'; break;
        case 'ico': mime = 'image/vnd.microsoft.icon'; break;
    }

    console.log('\x1b[1;36m[REQ] GET [%s] %s\x1b[0m', mime, this.url.pathname);

    try {
      fs.accessSync(path, fs.constants.R_OK );
      http_body = fs.readFileSync(path);

      this.res.statusCode = 200;
      this.res.setHeader('Content-Type', mime);
      this.res.end( http_body );

    } catch (err) {
      console.error(err);
      this.res.statusCode = 404;
      this.res.end('');
    }
  }
}

module.exports.Resource = Resource;
