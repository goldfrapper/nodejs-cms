/**
 * Project: NodeJS-CMS
 *
 * (c) GPL-3.0 license
 **/

const {System} = require(__dirname+'/system.js');

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
    store = store || 'post';
    const chunks = [], qs = require('querystring');

    if(store == 'postdata') {
      if(!this.#_stores['postdata']) {
        this.#_stores['postdata'] = await this.parseMultipartFormData();
      }
      return this.#_stores['postdata'];
    }

    if(!this.#_stores['post']) {
      for await (const chunk of this.req) {
        chunks.push(chunk);
      }
      let a = this.#_stores['post'] = new Map();
      let x = qs.parse(chunks.join());
      for(const k in x) a.set(k, x[k]);
    }
    return this.#_stores['post'];
  }

  async parseMultipartFormData()
  {
    const chunks = [], postdata = new Set();

    // Get Buffer
    for await (const chunk of this.req) {
      chunks.push(chunk);
    }

    // await this.req.on('data', chunk => {
    //   console.log('data', chunk);
    //   chunks.push(chunk);
    // });
    //
    // await this.req.on('end', () => {
    //   console.log('done');
    // });

    if(!this.req.complete) console.log('fout!!!!!!!');
    const buf = Buffer.concat(chunks);

    const length = this.req.headers['content-length'];
    System.log('Parsing multipart/formdata: '+length+'/'+Buffer.length+'b', 'REQ');

    const parseHeader = (header, headers) =>
    {
      const a = header.split(':');
      const b = a[1].split(';');

      for(const i in b) {
        const s = new String(b[i]).trim();
        const idx = s.indexOf('=');

        if(idx > 0) {
          headers.set(s.substring(0, idx), s.substring(idx+1).replace(/"/g,''));
        } else {
          headers.set(a[0], s);
        }
      }
    }

    // Get boundary
    const h = new Map();
    parseHeader('content-type:'+this.req.headers['content-type'], h);
    const boundary = h.get('boundary');

    const newline = "\r\n", bLength = boundary.length + 2;
    let i = 0, offSet = 0, parseHeaders = false, headers;

    while( (i = buf.indexOf(newline, offSet)) && i >= 0 )
    {
      let sub = buf.subarray(offSet, i);

      // if(sub.startsWith('--'+boundary)) {
      if(sub.length == bLength && sub.toString() == '--'+boundary) {
        if(headers) postdata.add(headers);  // End part

        parseHeaders = true;                // Start new part
        headers = new Map();
        headers.set('buffer', Buffer.alloc(0));
      }
      else if(parseHeaders && sub.length == 0) parseHeaders = false;
      else if(parseHeaders) parseHeader(sub.toString(), headers);
      else headers.set('buffer', Buffer.concat([headers.get('buffer'), sub]));

      offSet = i+newline.length;
    }
    return postdata;
  }
}

module.exports.WebService = WebService;
