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

    if(filter.toplevel) {
      where += ' AND ref NOT IN (SELECT DISTINCT ref FROM content_xref)';
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

        // console.log(parentRefs.size, content);
        if(parentRefs.size == 0) return results.shift();
        return filter.ref? parentRefs.get(filter.ref) : parentRefs;
      })
      .catch( err => this._dbError(err) );
  }

  async saveContent( content )
  {
    return this._getInsertStatement('content', content)
      .then(stat => {
        stat.run(Object.values(content));
        stat.finalize();
      })
  }
}

class ContentFilter
{
  ref = null;
  loadBag = false;
  toplevel = false;
}

class Content
{
  ref;
  type;
  title;
  pubDate;
  cDate;
  status;
  link;
  content;

  static statusCodes = ['draft','published'];

  static #_contentTypes = {};


  static getContentByRef( contentRef )
  {
   const storage = new ContentStorage();
   const filter = new ContentFilter();
   filter.ref = contentRef;
   return storage.getContent(filter);
  }

  static getContent()
  {
   const st = new ContentStorage();
   const filter = new ContentFilter();
   filter.loadBag = false;
   // filter.toplevel = true;
   return st.getContent(filter);
  }

  static saveContent( content ) {
    const st = new ContentStorage();
    return st.saveContent(content);
  }

  static registerContentType( ref, classObject )
  {
    this.#_contentTypes[ref] = classObject;
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
    return instance;
  }

  getContentForm() {
   return new ContentForm(this);
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

class Menu extends ContentBag {}
Content.registerContentType('menu', Menu);


class ObjectFormInput
{
  type;
  id;
  name;
  value;
  label;
  helpId;
  helpText;

  constructor(type, name, value, label, helpText) {
    this.type = type;
    this.id = name+'Id';
    this.name = name;
    this.value = value;
    this.label = label;
    this.helpId = name+'Help';
    this.helpText = helpText;
  }
}

class ObjectFormSelect extends ObjectFormInput
{
  options = new Set();
  constructor(name, value, label, helpText) {
    super();
    this.type = 'select';
  }
}

class ObjectForm
{
  action;
  method;
  inputs = new Set();

  static createInput(type, name, value, label, helpText) {
    return new ObjectFormInput(type, name, value, label, helpText)
  }

  static createSelect(name, value, label, helpText) {
    return new ObjectFormSelect(name, value, label, helpText);
  }

  add(type, name, value, label, helpText)
  {
    this.inputs.add(new ObjectFormInput(type, name, value, label, helpText));
  }

  // add(input) {
  //   this.inputs.add(input);
  // }

  list() {
    return Array.from( this.inputs.values() );
  }
}

class ContentForm extends ObjectForm
{
  constructor( content )
  {
    super();
    this.method = 'POST';
    this.action = '/admin/content?ref='+content.ref;

    // const input = ContentForm.createInput;
    // const select = ContentForm.createSelect;

    // this.add(input('hidden','ref',content.ref));
    // this.add(input('hidden','type', content.constructor.name));
    // this.add(input('text','title',content.title,'Title','Title for the article'));
    // this.add(input('date','pubDate',content.pubDate,'Publishing date'));
    // this.add(input('hidden','cDate',content.cDate));
    // this.add('select','status',content.status,'Status');
    // this.add(input('text','link',content.link,'Link');
    // this.add(input('textarea','content',content.content,'Content');

    this.add('hidden','ref',content.ref);
    this.add('hidden','type', content.constructor.name);
    this.add('text','title',content.title,'Title','Title for the article');
    this.add('date','pubDate',content.pubDate,'Publishing date','');
    this.add('hidden','cDate',content.cDate,'','');
    this.add('select','status',content.status,'Status','');
    this.add('text','link',content.link,'Link','');
    this.add('textarea','content',content.content,'Content','');
  }
}


module.exports.Content = Content;
