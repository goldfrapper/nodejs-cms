/**
 * Project: NodeJS-CMS
 *
 * (c) GPL-3.0 license
 **/

const {Settings} = require(__dirname + '/settings.js');
const {WebPage} = require(__dirname + '/webpage.js');
const {Content} = require(__dirname + '/content.js');

class AdminPage extends WebPage
{
  async run()
  {
    if(this.method == 'POST') {
      this.handlePost();
      return;
    }

    this.data.admin = {
      nav: ['dashboard','settings','content','theme']
    };
    const settings = await Settings.loadSettings();

    // NOTE: Pug does not (yet) support iterations over ES6 collections
    this.data.settings = Object.fromEntries(settings);

    // Handle pageName
    const p = this.url.pathname;
    const pageTitle = p.substring('/admin/'.length);
    if(pageTitle == '') { this.redirect('/admin/dashboard'); return; }
    if(this.data.admin.nav.indexOf(pageTitle) == -1) this.statusCode = 404;

    // Content
    if(pageTitle == 'content') {
      // Get contentlist
      let list = await Content.getContent();
      this.data.contentlist = list;
// console.log(list);

      // Get content item (if set)
      const ref = this.getParam('ref');
      if(ref) {
        const content = await Content.getContentByRef(ref);
        // const form = Content.getContentForm(content);

        // console.log(content);
        const form = content.getContentForm();
        this.data.content = content;
        this.data.form = form;
      }
    }

    this.template = 'admin';
    this.data.page.title = pageTitle;
    this.compile();
  }

  async handlePost()
  {
    const settings = await Settings.loadSettings();
    const post = await this.getStore();
    post.forEach((val, key) => {
      if(settings.has(key)) {
        settings.get(key).value = val;
      }
    });
    await Settings.saveSettings(settings);
  }
}

module.exports.AdminPage = AdminPage
