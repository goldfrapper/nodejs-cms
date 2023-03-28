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
// const Plant = System.require('plant', 'plugin');



class AdminPage extends WebPage
{
  #_pageName;
  #_modules = ['dashboard','settings','content','plugins'];

  async run()
  {
    console.log('\x1b[1;35m[REQ] %s %s\x1b[0m',this.method, this.url.href);

    // Handle POST
    if(this.method == 'POST') this.data.post = await this.getStore();

    // Get pageName
    this.#_pageName = this.url.pathname.substring('/admin/'.length);

    // Handle Missing/Bad pagename
    if(this.#_pageName == '') { this.redirect('/admin/dashboard'); return; }
    if(this.#_modules.indexOf(this.#_pageName) === -1) this.statusCode = 404;
    else this.statusCode = 200;

    //
    // Handle Modules
    //

    // Content
    if(this.#_pageName == 'content') {

      if(this.method == 'POST') { this.handlePost(); return; }

      // Set data
      this.data.contentlist = await Content.getContent();
      this.data.contentTypes = Content.listContentTypes();

      // Get content item (if set)
      const ref = this.getParam('ref');
      const type = this.getParam('type');

      if(type) this.data.contentType = type.toLowerCase();

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
      this.template = 'admin';
    }

    else if(this.#_pageName == 'plugins') {
      this.data.plugins = System.getPlugins();

      const plugin = this.getParam('plugin');
      if(plugin && this.data.plugins.has(plugin)) {
        this.data.plugin = this.data.plugins.get(plugin);
        const mod = System.require(plugin, 'plugin');
        await mod.handleRequest(this);
      } else {
        this.template = 'admin';
      }
    }

    // Settings and dashboard
    else {
      if(this.method == 'POST') { this.handlePost(); return; }
      this.template = 'admin';
    }

    this.data.settings = await Settings.loadSettings(); // Load settings
    this.data.admin = {nav: this.#_modules};
    this.data.page.title = this.#_pageName;
    this.compile();
  }

  async handlePost()
  {
    const post = await this.getStore();
    // const post = this.post;
    // console.log(post);

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
