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
  #_stores = [];

  static createService( req, res )
  {
    let service;
    const url = new URL(req.url, 'http://'+req.headers.host);

    if(url.pathname.indexOf('/resources') == 0) {
      const {Resource} = require(__dirname + '/resource.js');
      service = new Resource(req, res);
    }
    else if(url.pathname.indexOf('/admin') == 0) {
      const {AdminPage} = require(__dirname + '/adminpage.js');
      service = new AdminPage(req, res);
    }
    else {
      const {WebPage} = require(__dirname + '/webpage.js');
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

  get action() { return this.getParam('pathname', 'url'); }

  get method() { return this.req.method; }

  getParam( key, store )
  {
    if(!store) return this.url.searchParams.get(key) || null;
    if(store == 'url') return this.url[key];
    if(store == 'header') return this.req.headers[key];
  }

  async getStore( store )
  {
    const chunks = [], qs = require('querystring');

    if(!this.#_stores['post']) {
      for await (const chunk of this.req) {
        chunks.push(chunk);
      }
      let a = this.#_stores['post'] = new Map();
      let x = qs.parse(chunks.join());
      // for(const k in x) a[k] = x[k];
      for(const k in x) a.set(k, x[k]);
    }
    return this.#_stores['post'];
  }
}

module.exports.WebService = WebService;
