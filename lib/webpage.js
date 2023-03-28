/**
 * Project: NodeJS-CMS
 *
 * (c) GPL-3.0 license
 **/
// const {WebService} = require(__dirname + '/webservice.js');
// const {Settings} = require(__dirname + '/settings.js');
// const {Content} = require(__dirname + '/content.js');

const {System} = require(__dirname + '/system.js');
const {WebService} = System.require('webservice');
const {Settings} = System.require('settings');
const {Content} = System.require('content');

class WebPage extends WebService
{
  template;
  statusCode = 404;
  data = { page: {title:'',subtitle:'',brand:''}};

  async run()
  {
    console.log('\x1b[1;35m[REQ] %s %s\x1b[0m',this.method, this.url.href);

    const home_url = '/planten';
    const link = (this.url.pathname == '/')? home_url : this.url.pathname;
    const content = await Content.getContentForLink(link);
    const settings = await Settings.loadSettings();

    if(content) {
      this.statusCode = 200;
      this.template = content.template;
      this.data = {
        content: content,
        settings: settings,
        socials: await Content.getContentByRef('socials'),
        menu: await Content.getContentByRef('topmenu'),
        page: {
          title: settings.get('site_title').value,
          subtitle: settings.get('site_subtitle').value,
          brand: settings.get('site_brand').value
        }
      }
      await content.handleRequest(this);
    }
    this.compile();





    // if(this.url.pathname == '/') {
    //   this.template = 'home';
    //   const article = await Content.getContentByRef('planten');
    //   this.data.content = article;
    // }
    // else {
    //   const content = await Content.getContentForLink(this.url.pathname);
    //   if(!content) {
    //     this.statusCode = 404;
    //     this.compile();
    //     return;
    //   }
    //   else {
    //     this.template = 'home';
    //     this.data.content = content;
    //   }
    // }
    //
    // // Fix costum template
    // this.template = this.data.content.template;
    //
    // const settings = await Settings.loadSettings();
    //
    // this.data.settings = settings;
    // this.data.socials = await Content.getContentByRef('socials');
    // this.data.menu = await Content.getContentByRef('topmenu');
    //
    // // console.log(this.data.menu.size);
    //
    // this.data.page = {
    //   title: settings.get('site_title').value,
    //   subtitle: settings.get('site_subtitle').value,
    //   brand: settings.get('site_brand').value
    // };
    //
    // this.compile();
  }

  compile() {
    // Handle http status codes > template
    if(this.statusCode == 404) this.template = '404';

    // Run Pug
    const pug = require('pug');

    if(typeof this.template != 'string' || !this.template) {
      throw new TypeError('Bad template');
    }
    if(this.template[0] !== '/') {
      this.template = 'templates/'+this.template+'.pug';
    }

    const options = {basedir: System.loadSystem().path};
    const f = pug.compileFile(this.template, options);
    const http_content = f(this.data);

    // Setup response
    if(this.statusCode != 200) {
      console.log('\x1b[1;31m[RES] %s %s\x1b[0m',this.statusCode, this.url.href);
    }
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

module.exports.WebPage = WebPage;
