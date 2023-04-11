/**
 * Project: NodeJS-CMS
 *
 * (c) GPL-3.0 license
 **/

// const Path = require('path');

const dir = __dirname.substring(0, __dirname.indexOf('/plugin/'));
const {System} = require(dir + '/lib/system.js');
const {SQLiteStorage} = System.require('SQLiteStorage');
const {Content,ContentBag} = System.require('content');

class Image extends Content {}
class Gallery extends ContentBag {}
Content.registerContentType(Image);
Content.registerContentType(Gallery);
// Content.registerContentTemplate(Gallery, __dirname+'/gallery.pug');

class Service
{
  static async handleRequest(service)
  {
    //
    // HTTP POST
    //
    if(service.method == 'POST')
    {
      const post = await service.getStore('postdata');

      console.log(post);

      let content;
      // const post = await service.getStore();

      if(post.has('remove')) {
        const ref = post.get('ref');
        //
      }
      else if(post.has('add'))
      {



        const ref = post.get('ref');
        const title = post.get('title');
        const type = post.get('type');
        const parentRef = post.get('parentRef');

        const file = post.get('file');
        const url = post.get('url');

        // const d = {}, i;
        // for(i in ['ref','title','type','parentRef']) d[i] = post.get(d);

        // Create new Gallery/Image
        let link = title.replace(/[^a-z0-9 ]/ig,'').replace(/\s+/ig,'-');
        link = link.toLowerCase();

        // d.link = link;
        // const content = Content.createContentInstance(d);

        content = Content.createContentInstance({
          type: type, title: title, link: link
        })

        // console.log(content);
        const res = await Content.saveContent(content);
        // console.log(res);

        if(parentRef) {
          await Content.saveContentXRef(parentRef, content.ref);
        }
      }
      else {
        throw new TypeError('BAD REQUEST');
      }

      let url = '/admin/plugins?plugin=gallery';
      if(content) url += '&ref='+content.ref;
      service.redirect(url);
    }

    //
    // HTTP GET
    //
    else
    {
      let gallery;
      const ref = service.getParam('ref');
      if(ref) gallery = await Content.getContentByRef(ref);

      service.template = __dirname + '/admin.pug';
      service.data.contentlist = await Content.getContentForType('gallery');
      service.data.gallery = gallery || null;
    }
  }
}

module.exports = Service;
