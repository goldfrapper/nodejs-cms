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
    console.log('\x1b[1;35m[REQ] %s %s\x1b[0m',this.method, this.url.href);

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

      // Set data
      this.data.contentlist = await Content.getContent();
      this.data.contentTypes = Content.listContentTypes();

      // Get content item (if set)
      const ref = this.getParam('ref');
      const type = this.getParam('type');
      // console.log(ref, type);
      if(ref) {
        if(ref == 'new' && type) {
          this.data.content = Content.createContentInstance({
            type: type.toLowerCase()
          });
        } else {
          this.data.content = await Content.getContentByRef(ref);
        }

        // console.log('content: ', this.data.content);
      } else {

      }
    }

    this.template = 'admin';
    this.data.page.title = pageTitle;
    this.compile();
  }

  async handlePost()
  {
    const post = await this.getStore();
    console.log(post);

    // console.log(post);
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
      if(post.has('type')) {
        const data = Object.fromEntries(post);
        const content = Content.createContentInstance(data);

        if(post.has('delete')) {
          await Content.removeContent(content);
        } else {
          await Content.saveContent(content);
        }
      }

      if(post.has('parentRef')) {
        const method = (post.has('delete')? 'remove':'save') + 'ContentXRef';
        await Content[method]( post.get('parentRef'), post.get('ref'));
      }

      const contentRef =  post.get('parentRef') || post.get('ref')
      this.redirect('/admin/content?ref='+contentRef);
    }
   }
}

module.exports.AdminPage = AdminPage
