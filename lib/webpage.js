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

  async run() {
    const p = this.url.pathname;
    const settings = await Settings.loadSettings();

    // NOTE: Pug does not (yet) support iterations over ES6 collections
    this.data.settings = Object.fromEntries(settings);

    this.data.socials = await Content.getContentByRef('socials');

    // this.data.getContentByRef = async function(ref) {
    //   return await Content.getContentByRef(ref);
    // }

    // const test = this.data.getContentByRef('socials');
    // console.log(test);

    // const html = Theme.renderPage(this.url.pathname);
    // const page = Theme.loadPage( this.url.pathname );
    // page.compile();
    // this.res.statusCode = this.statusCode;
    // this.res.end(http_content);


    if(p == '/') {
      this.template = 'home';
      this.data.page.title = settings.get('site_title').value;
      this.data.page.subtitle = settings.get('site_subtitle').value;

      const article = await Content.getContentByRef('lorem-ipsum');
      // console.log(article);
      this.data.content = article;

    }
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

module.exports.WebPage = WebPage;
