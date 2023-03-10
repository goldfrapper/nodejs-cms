/**
 * Project: NodeJS-CMS
 *
 * (c) GPL-3.0 license
 **/
const {WebService} = require(__dirname + '/webservice.js');
const {Settings} = require(__dirname + '/settings.js');

class WebPage extends WebService
{
  template;
  statusCode = 200;
  data = { page: { title:'Page title', subtitle:'Subtitle'}};

  run() {
    const p = this.url.pathname;

    if(p == '/') this.template = 'home';
    else this.statusCode = 404;

    this.compile();
  }

  compile() {
    // Handle http status codes > template
    if(this.statusCode == 404) this.template = '404';

    // Run Pug
    const pug = require('pug');
    const f = pug.compileFile('templates/'+this.template+'.pug');
    const http_content = f(this.data);

    // Setup response
    this.res.statusCode = this.statusCode;
    this.res.end(http_content);
  }

  redirect(url)
  {
    this.res.statusCode = 303;
    this.res.setHeader('Location', url);
    this.res.end('');
  }
}

class AdminPage extends WebPage
{
  run() {

    this.data.admin = {
      nav: ['dashboard','settings','content']
    };

    // NOTE: Pug does not (yet) support iterations over ES6 collections
    const settings = Settings.loadSettings();
    this.data.settings = Object.fromEntries(settings);

    // Get pageName
    const p = this.url.pathname;
    const pageTitle = p.substring('/admin/'.length);

    // Redirect to dashboard
    if(pageTitle == '') { this.redirect('/admin/dashboard'); return; }

    // Non existing page
    if(this.data.admin.nav.indexOf(pageTitle) == -1) this.statusCode = 404;

    this.template = 'admin';
    this.data.page.title = pageTitle;
    this.compile();
  }
}

module.exports.WebPage = WebPage;
module.exports.AdminPage = AdminPage
