/**
 * Project: NodeJS-CMS
 *
 * (c) GPL-3.0 license
 **/
const {SQLiteStorage} = require(__dirname + '/SQLiteStorage.js');

class ContentStorage extends SQLiteStorage
{
  getContentByRef( contentRef )
  {
    const sql = 'SELECT * FROM content WHERE ref=? LIMIT 1;';
    return this._getPromise('get',sql,[contentRef])
      .then(content => {
        switch(content.type) {
          case 'article': content.constructor = Article; break;
          case 'file': content.constructor = File; break;
          default: content.constructor = Content;
        }
        return content;
      })
      .catch( err => this._dbError(err) );
  }

  getContent()
  {
    const results = [];
    const sql = 'SELECT * FROM content';
    return this._getPromise('each',sql,[],(content)=>{
      switch(content.type) {
        case 'article': content.constructor = Article; break;
        case 'file': content.constructor = File; break;
        default: content.constructor = Content;
      }
      results.push(content);
    })
      .then(content => {
        return results;
      })
      .catch( err => this._dbError(err) );
  }
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

   static statusCodes = ['draft'];

   static saveContent( content )
   {
     // const st = new ContentStorage();
     const type = content.constructor.name;
   }

   static getContentByRef( contentRef )
   {
     const st = new ContentStorage();
     return st.getContentByRef(contentRef);
   }

   static getContent()
   {
     const st = new ContentStorage();
     return st.getContent();
   }

   static getContentForm( content )
   {
     return new ContentForm(content);
   }

   //static publishContent( contentRef, pubDate ) {}
 }

 class FileContent extends Content
 {
 }

 class Article extends Content
 {
 }


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

class ObjectForm
{
  action;
  method;
  inputs = new Set();

  add(type, name, value, label, helpText)
  {
    this.inputs.add(new ObjectFormInput(type, name, value, label, helpText));
  }

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

    this.add('hidden','ref',content.ref);
    this.add('hidden','type', content.constructor.name);
    this.add('text','title',content.title,'Title','Title for the article');
    this.add('date','pubDate',content.title,'Publishing date','');
    this.add('hidden','cDate',content.title,'','');
    this.add('hidden','status',content.title,'Status','');
    this.add('text','link',content.title,'Link','');
    this.add('textarea','content',content.content,'Content','');
  }
}


module.exports.Content = Content;
