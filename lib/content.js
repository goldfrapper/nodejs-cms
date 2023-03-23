/**
 * Project: NodeJS-CMS
 *
 * (c) GPL-3.0 license
 **/
const {SQLiteStorage} = require(__dirname + '/SQLiteStorage.js');

class ContentStorage extends SQLiteStorage
{
  getContent( filter )
  {
    const results = [];
    const params = [];
    let where = '';
    const parentRefs = new Map();

    if(filter.ref) {
      where += ' AND ref=?';
      where += ' OR ref in (SELECT ref FROM content_xref WHERE parentRef=?)';
      params.push(filter.ref,filter.ref);
    }
    else if(filter.link) {
      where += ' AND (link = ? OR ref IN (';
      where += 'SELECT content FROM content WHERE link=? AND type=\'link\'))';
      where += ' AND type != \'link\'';
      params.push(filter.link,filter.link);
    }

    const sql = `
      SELECT * FROM content
      LEFT OUTER JOIN content_xref USING(ref)
      WHERE 1 ${where}
      ORDER BY parentRef ASC, sorder ASC`;

    return this._getPromise('each',sql,params,(row)=>{

      const content = Content.createContentInstance(row);

      if(!row.parentRef) {
        parentRefs.set(content.ref, content);
      }
      results.push(content);

      if(row.parentRef && parentRefs.has(row.parentRef)) {
        const parent = parentRefs.get(row.parentRef);
        parent.add(content);
      }
    })
      .then(content => {
        if(results.length == 1) return results.shift();
        if(parentRefs.size == 0) return results.shift();
        return filter.ref? parentRefs.get(filter.ref) : parentRefs;
      })
      .catch( err => this._dbError(err) );
  }

  saveObject(object)
  {
    let table = 'content';
    if(object.constructor.name == 'ContentXRef') table = 'content_xref';
    return this._saveObject(table, object);
  }

  removeObject(object)
  {
    let table = 'content';
    if(object.constructor.name == 'ContentXRef') table = 'content_xref';
    return this._removeObject(table, object);
  }
}

class ContentFilter
{
  ref = null;
  loadBag = false;
  // toplevel = false;
  link;

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

  static statusCodes = ['draft','onhold','published'];

  static #_contentTypes = {};

  static _getContent(data) {
    const st = new ContentStorage();
    return st.getContent( new ContentFilter(data) );
  }

  static getContentByRef( contentRef )
  {
    return this._getContent({ref: contentRef});
  }

  static getContentForLink( url )
  {
    return this._getContent({link: url});
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
    // return st.removeContentXRef(xref).then(x => console.log(x));
    return st.removeObject(xref).then(x => console.log(x));
  }

  static registerContentType( ref, classObject )
  {
    // const ref = classObject.prototype.constructor.name;
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
      instance = new Content();
    }

    for(const val in data) {
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
}

class ContentBag extends Content {
  #_items = new Set();

  get isBag() { return true; }

  add( content ) {
    this.#_items.add(content);
  }

  get size() { return this.#_items.size }

  entries() {
    return this.#_items.values();
  }
}

class Socials extends ContentBag {}
Content.registerContentType('socials', Socials);

class Link extends Content {}
Content.registerContentType('link', Link);

class Article extends Content {}
Content.registerContentType('article', Article);

class Url extends Content {}
Content.registerContentType('url', Url);

class Menu extends ContentBag {}
Content.registerContentType('menu', Menu);

class Filelist extends ContentBag {}
Content.registerContentType('filelist', Filelist);

class Catalog extends ContentBag {}
Content.registerContentType('Catalog', Catalog);
class Product extends Content {}
Content.registerContentType('Product', Product);
class Category extends ContentBag {}
Content.registerContentType('Category', Category);

// class ObjectFormInput
// {
//   type;
//   id;
//   name;
//   value;
//   label;
//   helpId;
//   helpText;
//
//   constructor(type, name, value, label, helpText) {
//     this.type = type;
//     this.id = name+'Id';
//     this.name = name;
//     this.value = value;
//     this.label = label;
//     this.helpId = name+'Help';
//     this.helpText = helpText;
//   }
// }

// class ObjectFormSelect extends ObjectFormInput
// {
//   options = new Set();
//   constructor(name, value, label, helpText) {
//     super();
//     this.type = 'select';
//   }
// }

// class ObjectForm
// {
//   action;
//   method;
//   inputs = new Set();
//
//   static createInput(type, name, value, label, helpText) {
//     return new ObjectFormInput(type, name, value, label, helpText)
//   }
//
//   static createSelect(name, value, label, helpText) {
//     return new ObjectFormSelect(name, value, label, helpText);
//   }
//
//   add(type, name, value, label, helpText)
//   {
//     this.inputs.add(new ObjectFormInput(type, name, value, label, helpText));
//   }
//
//   // add(input) {
//   //   this.inputs.add(input);
//   // }
//
//   list() {
//     return Array.from( this.inputs.values() );
//   }
// }

// class ContentForm extends ObjectForm
// {
//   constructor( content )
//   {
//     super();
//     this.method = 'POST';
//     this.action = '/admin/content?ref='+content.ref;
//
//     // const input = ContentForm.createInput;
//     // const select = ContentForm.createSelect;
//
//     // this.add(input('hidden','ref',content.ref));
//     // this.add(input('hidden','type', content.constructor.name));
//     // this.add(input('text','title',content.title,'Title','Title for the article'));
//     // this.add(input('date','pubDate',content.pubDate,'Publishing date'));
//     // this.add(input('hidden','cDate',content.cDate));
//     // this.add('select','status',content.status,'Status');
//     // this.add(input('text','link',content.link,'Link');
//     // this.add(input('textarea','content',content.content,'Content');
//
//     this.add('hidden','ref',content.ref);
//     this.add('hidden','type', content.constructor.name);
//     this.add('text','title',content.title,'Title','Title for the article');
//     this.add('date','pubDate',content.pubDate,'Publishing date','');
//     this.add('hidden','cDate',content.cDate,'','');
//     this.add('select','status',content.status,'Status','');
//     this.add('text','link',content.link,'Link','');
//     this.add('textarea','content',content.content,'Content','');
//   }
// }


module.exports.Content = Content;
