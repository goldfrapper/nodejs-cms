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
    let path = this.path;
    let p = this.url.pathname;
    let mime;
    let ext = p.substring(p.lastIndexOf('.')+1);


    // Get extension => mimetype
    switch(ext) {
        case 'js': mime = 'text/javascript'; break;
        case 'css': mime = 'text/css'; break;
        case 'png': mime = 'image/png'; break;
        case 'svg': mime = 'image/svg'; break;
        case 'ico': mime = 'image/vnd.microsoft.icon'; break;
        case 'map': mime = 'application/json'; break;
        default: mime = 'text/plain'; break;
    }

    if(p.indexOf('bootstrap') != -1) {
      path += 'node_modules/bootstrap/dist/';

      // Map request (ex: developer plugins)
      // https://sourcemaps.info/spec.html
      if(ext == 'map') {
        const idx = p.lastIndexOf('.');
        ext = p.substring(p.lastIndexOf('.', idx-1)+1,idx);
      }
      path += ext;
      path += p.substring('/resources'.length);
    } else {
      path += p;
    }

    console.log('\x1b[1;36m[REQ] GET [%s] %s\x1b[0m', mime, this.url.pathname);

    try {
      const fs = require('fs');
      fs.accessSync(path, fs.constants.R_OK );
      http_body = fs.readFileSync(path);

      this.res.statusCode = 200;
      this.res.setHeader('Content-Type', mime);
      this.res.end( http_body );

    } catch (err) {
      if(this.statusCode != 200) {
        console.log('\x1b[1;31m[RES] %s %s\x1b[0m',this.res.statusCode, this.url.href);
      }
      console.error(err);
      this.res.statusCode = 404;
      this.res.end('');
    }
  }
}

module.exports.Resource = Resource;
