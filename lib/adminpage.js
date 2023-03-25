/**
 * Project: NodeJS-CMS
 *
 * (c) GPL-3.0 license
 **/

const {System} = require(__dirname + '/system.js');
const {Settings} = System.require('settings');
const {WebPage} = System.require('webpage');
const {Content} = System.require('content');


// Plugins
const Plant = System.require('plant', 'plugin');



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

    this.data.settings = settings;

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
      await Settings.saveSettings(post);
    }

    else if(this.#_pageName == 'content')
    {
      if(post.has('type')) {      // Save Content
        const data = Object.fromEntries(post);
        const content = Content.createContentInstance(data);

        const method = (post.has('delete')? 'remove':'save') + 'Content';
        await Content[method](content);
      }

      if(post.has('parentRef')) {   // Save ContentXRef
        const method = (post.has('delete')? 'remove':'save') + 'ContentXRef';
        await Content[method]( post.get('parentRef'), post.get('ref'));
      }

      const contentRef =  post.get('parentRef') || post.get('ref')
      this.redirect('/admin/content?ref='+contentRef);
    }
   }
}

module.exports.AdminPage = AdminPage
