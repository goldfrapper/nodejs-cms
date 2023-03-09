/**
 * Project: NodeJS-CMS
 *
 * (c) GPL-3.0 license
 **/
const {WebService} = require(__dirname + '/webservice.js');

class WebPage extends WebService
{
  template;
  statusCode = 200;
  data = { page: { title:'Page title', subtitle:'Subtitle'}};

  run() {

      // let template, statusCode;
      // const page = { title:'Page title', subtitle:'Subtitle'};
      // const data = {page:page};
      const p = this.url.pathname;

      if(p == '/') this.template = 'home';
      else if(p.indexOf('/admin') == 0) {
        this.template = 'admin';
        this.data.page.title = p.substring('/admin/'.length);
      }
      else this.template = '404';

      // const http_content = this.compile(this.template, this.data);

      const http_content = this.compile();

      if(this.template == '404') this.statusCode = 404;

      this.res.statusCode = this.statusCode;
      this.res.end(http_content);

    }

    compile(template, data)
    {
      const pug = require('pug');
      const f = pug.compileFile('templates/'+this.template+'.pug');
      return f(this.data);
    }
}

class AdminPage extends WebPage
{
  // run() {
  //   let template, statusCode;
  // }
}

module.exports.WebPage = WebPage;
module.exports.AdminPage = AdminPage
