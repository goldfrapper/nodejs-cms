/**
 * Project: NodeJS-CMS
 *
 * (c) GPL-3.0 license
 **/



class WebService
{
  req;
  res;
  url;

  path;

  static createService( req, res )
  {
    let service;
    const url = new URL(req.url, 'http://'+req.headers.host);

    if(url.pathname.indexOf('/resources') == 0) {
      const {Resource} = require(__dirname + '/resource.js');
      service = new Resource(req, res);
    }
    else if(url.pathname.indexOf('/admin') == 0) {
      const {AdminPage} = require(__dirname + '/page.js');
      service = new AdminPage(req, res);
    }
    else {
      const {WebPage} = require(__dirname + '/page.js');
      service = new WebPage(req, res);
    }

    return service;
  }

  constructor( req, res ) {
    this.req = req;
    this.res = res;
    this.url = new URL(req.url, 'http://'+req.headers.host);
    this.req.setEncoding = 'utf8';
    this.path = __dirname.substring(0,__dirname.lastIndexOf('/')+1);
  }

  run() {

    this.res.statusCode = 200;
    this.res.end('Content xxx');

  }
}

module.exports.WebService = WebService;
