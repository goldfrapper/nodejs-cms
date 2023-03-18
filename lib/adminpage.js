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
  #_pageName;

  async run()
  {

    // Get pageName
    const p = this.url.pathname;
    const pageTitle = p.substring('/admin/'.length);
    this.#_pageName = pageTitle;

    // Handle POST
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

    // Handle Missing/Bad pagename
    if(pageTitle == '') { this.redirect('/admin/dashboard'); return; }
    if(this.data.admin.nav.indexOf(pageTitle) == -1) this.statusCode = 404;

    // Content
    if(pageTitle == 'content') {
      // Get contentlist
      let list = await Content.getContent();
      this.data.contentlist = Object.fromEntries(list);
// console.log(list);

      // Get content item (if set)
      const ref = this.getParam('ref');
      if(ref) {
        const content = await Content.getContentByRef(ref);
        // const form = Content.getContentForm(content);

// if(content.isBag) console.log(content.entries());
// console.log(ref,content);
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
    const post = await this.getStore();
    if(this.#_pageName == 'settings')
    {
      const settings = await Settings.loadSettings();
      post.forEach((val, key) => {
        if(settings.has(key)) {
          settings.get(key).value = val;
        }
      });
      await Settings.saveSettings(settings);
    }

    else if(this.#_pageName == 'content')
    {
      let content;
      const ref = this.getParam('ref');
      if(ref) {
        content = await Content.getContentByRef(ref);
        post.forEach((v, k) => { if(k in content) content[k] = v } );
      }
      else {
        content = Content.createContentInstance(post);
      }
      await Content.saveContent(content);
      this.redirect('/admin/content?ref='+content.ref);
    }
   }
}

module.exports.AdminPage = AdminPage
