/**
 * Project: NodeJS-CMS
 *
 * (c) GPL-3.0 license
 **/
const {WebService} = require(__dirname + '/webservice.js');

class Page extends WebService
{
    run() {

      let template, statusCode;
      const page = { title:''};
      const p = this.url.pathname

      if(p == '/') template = 'home';
      else if(p.indexOf('/admin') == 0) {
        template = 'admin';
        page.title = p.substring('/admin/'.length);
      }
      else template = '404';

      const http_content = this.compile(template, page);

      if(template == '404') statusCode = 404;
      else statusCode = 200;
      this.res.statusCode = statusCode;
      this.res.end(http_content);

    }

    compile(template, data)
    {
      const pug = require('pug');
      const f = pug.compileFile('templates/'+template+'.pug');
      return f(data);
    }
}

module.exports.Page = Page;
