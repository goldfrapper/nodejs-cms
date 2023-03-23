/**
 * Project: NodeJS-CMS
 *
 * (c) GPL-3.0 license
 **/
const {WebService} = require(__dirname + '/webservice.js');
const {Settings} = require(__dirname + '/settings.js');
const {Content} = require(__dirname + '/content.js');

class WebPage extends WebService
{
  template;
  statusCode = 200;
  data = {
    page: {},
    settings: null
  };

  async run()
  {
    console.log('\x1b[1;35m[REQ] %s %s\x1b[0m',this.method, this.url.href);

    if(this.url.pathname == '/') {
      this.template = 'home';
      const article = await Content.getContentByRef('lorem-ipsum');
      this.data.content = article;
    }
    else {
      const content = await Content.getContentForLink(this.url.pathname);
      if(!content) {
        this.statusCode = 404;
        this.compile();
        return;
      }
      else {
        this.template = 'home';
        this.data.content = content;
      }
    }

    const settings = await Settings.loadSettings();

    // NOTE: Pug does not (yet) support iterations over ES6 collections
    this.data.settings = Object.fromEntries(settings);
    this.data.socials = await Content.getContentByRef('socials');
    this.data.menu = await Content.getContentByRef('topmenu');

    this.data.page = {
      title: settings.get('site_title').value,
      subtitle: settings.get('site_subtitle').value,
      brand: settings.get('site_brand').value
    };

    // Run Markdown
    if(this.data.content && this.data.content.type == 'article') {
      const content = this.data.content;
      const MarkdownIt = require('markdown-it');
      const md = new MarkdownIt();
      if(typeof content.content === 'string') {
        content.content = md.render(content.content);
      }
    }

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
