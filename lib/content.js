/**
 * Project: NodeJS-CMS
 *
 * (c) GPL-3.0 license
 **/

const {System} = require(__dirname + '/system.js');
const {SQLiteStorage} = System.require('SQLiteStorage');

class ContentStorage extends SQLiteStorage
{
  getContent( filter )
  {
    const results = [];
    const params = [];
    let where = '';
    let select = '*';
    let join = 'LEFT OUTER JOIN content_xref USING(ref) ';
    const parentRefs = new Map();

    if(filter.ref) {
      where += ' AND ref=?';
      //where += ' OR ref in (SELECT ref FROM content_xref WHERE parentRef=?)';
      params.push(filter.ref);
    }
    else if(filter.link) {
      where += ' AND (link = ? OR ref IN (';
      where += 'SELECT content FROM content WHERE link=? AND type=\'link\'))';
      where += ' AND type != \'link\'';
      params.push(filter.link,filter.link);
    }
    else if(filter.parentRef) {
      where += ' AND parentRef=?';
      params.push(filter.parentRef);
    }

    if(filter.type) {
      where += ' AND type=? ';
      params.push(filter.type);
    }

    // Add metadata
    if(filter.loadMeta) {
      select = '*, json_group_object(key,value) as meta ';
      join += 'LEFT OUTER JOIN content_meta2 USING(ref) ';
    }

    const sql = `
      SELECT ${select} FROM content
      ${join}
      WHERE 1 ${where}
      GROUP BY ref
      ORDER BY parentRef ASC, sorder ASC`;

    return this._getPromise('each',sql,params,(row)=>{

      // TODO: JSON.parse should be done here because it is
      // Storage specific (abstraction)

      const content = Content.createContentInstance(row);

      // if(!row.parentRef) {
      //   parentRefs.set(content.ref, content);
      // }
      results.push(content);

      // if(row.parentRef && parentRefs.has(row.parentRef)) {
      //   const parent = parentRefs.get(row.parentRef);
      //   parent.add(content);
      // }

      // Load bag
      // if(content.isBag && filter.loadBag) {
      //   // console.log(content.constructor.name);
      //
      //   this.getContent(new ContentFilter({parentRef:content.ref})).then(x=>{
      //     // console.log(x.constructor.name);
      //     x.forEach(c => content.add(c));
      //   //   for(content in x) content.add(x);
      //   });
      // }
    })
      .then(x => {
        // if(filter.limit1) return results.shift();
        return filter.limit1? results.shift() : results;
        // if(results.length == 1) return results.shift();
        // if(parentRefs.size == 0) return results.shift();
        // return filter.ref? parentRefs.get(filter.ref) : parentRefs;
      })
      .catch( err => this._dbError(err) );
  }

  getObject(object)
  {
    let table, params = {};
    switch(object.constructor.name) {
      case 'ContentXRef': table = 'content_xref'; break;
      case 'ContentMeta': table = 'content_meta'; break;
      case 'Content': table = 'content'; break;
    }
    if(object.ref) params.ref = object.ref;
    if(object.parentRef) params.parentRef = object.parentRef;

    // console.log(object);

    return this._getObject(table, object, params).catch( err => this._dbError(err) );
  }

  getContentMeta(ref)
  {
    let sql = '', params = [ref], results = new Map();
    sql += 'SELECT key, value FROM content_meta WHERE ref=?';
    return this._getPromise('each',sql,params,(row)=>{
      results.set(row.key, row.value);
    }).then(x=>results).catch( err => this._dbError(err) );
  }

  saveObject(object)
  {
    let table = 'content';
    if(object.constructor.name == 'ContentXRef') table = 'content_xref';
    if(object.constructor.name == 'ContentMeta') table = 'content_meta';
    return this._saveObject(table, object);
  }

  removeObject(object)
  {
    let table = 'content';
    if(object.constructor.name == 'ContentXRef') table = 'content_xref';
    if(object.constructor.name == 'ContentMeta') table = 'content_meta';

    const obj = {ref:object.ref};
    if(object instanceof ContentXRef) obj.parentRef = object.parentRef;
    // if(object instanceof Content) object = {ref:object.ref};
    // if(object instanceof ContentXRef) object = {ref:object.ref};
    // if(object instanceof ContentMeta) object = {ref:object.ref};

    // If object == Content remove all XRefs and Meta

    return this._removeObject(table, obj);
  }
}

class ContentFilter
{
  ref = null;
  loadBag = false;
  loadMeta = false;
  // toplevel = false;
  link;
  limit1 = false;
  parentRef;
  type;

  constructor(options)
  {
    for(const k in options) this[k] = options[k];
  }
}

class ContentXRef
{
  parentRef;
  ref;
  sorder = 0;

  constructor(parentRef, ref, sorder)
  {
    this.parentRef = parentRef || 0;
    this.ref = ref || 0;
    this.sorder = sorder || 0;
    // console.log(arguments);
    // Object.getOwnPropertyNames(this).every((k,i)=>this[k]=arguments[i] || 0);
  }
}

class ContentMeta {
  ref;
  key;
  value;
  constructor(ref, key, value) {
    Object.getOwnPropertyNames(this).every((k,i)=>this[k]=arguments[i] || 0);
  }
}

class Content
{
  ref;
  type;
  title;
  pubDate;
  cDate;
  status = 'draft';
  link;
  content;

  #_meta = new Map();

  static statusCodes = ['draft','onhold','published'];

  static #_contentTypes = {};

  get editor() { return false; }

  get meta() { return this.#_meta; }

  set meta( data ) {
    this.#_meta = JSON.parse(data);
  }

  handleRequest() {}

  static async _getContent(data) {
    const st = new ContentStorage();


    const c = await st.getContent(new ContentFilter(data));

    // Get Bag
    if(c && c.isBag && data.loadBag) {
      await st.getContent(new ContentFilter({
        parentRef:c.ref,
        loadMeta: data.loadMeta
      }))
        .then(rows => {
          rows.forEach(x => c.add(x));
        });
    }

    // Get Meta
    // if(c && data.loadMeta) {
    //   c.#_meta = await Content.getContentMeta(c.ref);
    // }

    return c;
  }

  static getContentByRef( contentRef )
  {
    return this._getContent({
      ref:contentRef, limit1:true, loadBag:true, loadMeta:true
    });
  }

  static getContentForLink( url )
  {
    return this._getContent({
      link:url, limit1:true, loadBag:true, loadMeta:true
    });
  }

  static getContentForType( type )
  {
    return this._getContent({type:type, loadBag:true, loadMeta:true});
  }

  static getContent()
  {
    return this._getContent({});
  }

  static saveContent( content )
  {
    const st = new ContentStorage();
    return st.saveObject(content);
  }

  static removeContent( content )
  {
    const st = new ContentStorage();
    return st.removeObject(content);
  }

  static getContentXRef( ref )
  {
    if(typeof ref !== 'string') throw new TypeError('ref should be a string');
    const st = new ContentStorage();
    return st.getObject( new ContentXRef('', ref) );
  }

  static saveContentXRef( parentRef, ref, sorder )
  {
    const st = new ContentStorage();
    const xref = new ContentXRef(parentRef, ref, sorder);
    return st.saveObject(xref);
  }

  static removeContentXRef(parentRef, ref)
  {
    const st = new ContentStorage();
    const xref = new ContentXRef(parentRef, ref);
    return st.removeObject(xref);
  }

  static registerContentType( classObject )
  {
    const ref = classObject.prototype.constructor.name.toLowerCase();
    this.#_contentTypes[ref] = classObject;
  }

  static listContentTypes()
  {
    return Object.values(this.#_contentTypes)
      .map(x=>x.prototype.constructor.name);
  }

  static createContentInstance( data )
  {
    let instance;

    if(data.type && data.type in this.#_contentTypes) {
      instance = new this.#_contentTypes[data.type]();
    } else {

      // Try to get plugin
      try {
        System.require(data.type, 'plugin');
        instance = new this.#_contentTypes[data.type]();
      } catch(exc) {
        System.log('Unknown ContentType '+data.type, 'ERR');
      }

      instance = new Content();
    }

    for(const val in data) {
      // if(val=='meta') instance.#_meta = JSON.parse(data.meta);

      (val in instance) && (instance[val] = data[val]);
    }

    // Generate new ref
    if(!instance.ref) {
      const refgen = function(){
        return Array.from({length:10},()=>
          String.fromCharCode(Math.floor((Math.random()*26)+97))
        ).join('');
      }
      instance.ref = refgen();
    }

    return instance;
  }

  static getContentMeta( ref )
  {
    const st = new ContentStorage();
    return st.getContentMeta(ref);
  }

  static setContentMeta( ref, key, value )
  {
    const st = new ContentStorage();
    const meta = new ContentMeta(ref, key, value);
    return st.saveObject(meta);
  }

  static renderMarkdown(str) {
    const MarkdownIt = require('markdown-it');
    const md = new MarkdownIt();
    if(typeof str !== 'string') {
      throw new TypeError('Input should be a string');
    }
    return md.render(str);
  }

  static #_contentTemplates = new Map();

  static registerContentTemplate( contentType, templateFile )
  {
    // TODO Validate
    Content.#_contentTemplates.set(contentType, templateFile);
  }

  get template() {
    if(Content.#_contentTemplates.has(this.type))
      return Content.#_contentTemplates.get(this.type);
    else
      return 'home';
  }

  renderMarkdown() {
    return Content.renderMarkdown(this.content);
  }
}

class ContentBag extends Content {
  #_items = new Set();

  get isBag() { return true; }

  add( content ) {
    this.#_items.add(content);
  }

  get size() { return this.#_items.size }

  entries() {
    // return this.#_items.values();
    return this.#_items;
  }
}

class Socials extends ContentBag {}
Content.registerContentType(Socials);

class Link extends Content {}
Content.registerContentType(Link);

class Article extends Content {
  get editor() { return true; }
}
Content.registerContentType(Article);

class Url extends Content {}
Content.registerContentType(Url);

class Menu extends ContentBag {}
Content.registerContentType(Menu);

module.exports.Content = Content;
module.exports.ContentBag = ContentBag;
