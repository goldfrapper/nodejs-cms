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
    let limit = false;
    let where = ' WHERE 1';
/*
select content.* from content
left outer join content_xref USING(ref)
where ref='socials' or ref in (select ref from content_xref where parentRef='socials')
order by sorder ASC
*/
    if(filter.ref) {
      where += ' AND ref=?';
      limit = true;
      params.push(filter.ref);
    }

    if(filter.toplevel) {
      where += ' AND ref NOT IN (SELECT DISTINCT ref FROM content_xref)';
    }

    const sql = 'SELECT * FROM content'+where+(limit? ' LIMIT 1':'')+';'

    return this._getPromise('each',sql+where,params,(content)=>{
      content = Object.assign(new Content(), content);
      results.push(content);
    })
      .then(content => {
        return filter.ref? results.pop() : results;
      })
      .catch( err => this._dbError(err) );
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

   static saveContent( content )
   {
     // const st = new ContentStorage();
     const type = content.constructor.name;
   }

   static getContentByRef( contentRef )
   {
     const storage = new ContentStorage();
     // return st.getContentByRef(contentRef);

     const filter = new ContentFilter();
     filter.ref = contentRef;
     return storage.getContent(filter);
   }

   static getContent()
   {
     const st = new ContentStorage();
     const filter = new ContentFilter();
     filter.loadBag = false;
     filter.toplevel = true;
     return st.getContent(filter);
   }

   getContentForm() {
     return new ContentForm(this);
   }

   //static publishContent( contentRef, pubDate ) {}
 }

 // class ContentBag extends Content
 // {
 //   #_items = new Set();
 // }


// class Article extends Content
// {
//   getContentForm() {
//     return new ContentForm(content);
//   }
// }
// class Socials extends Content {
//   getContentForm() {
//     return null;
//   }
// }


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
