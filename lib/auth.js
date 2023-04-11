/**
 * Project: NodeJS-CMS
 *
 * (c) GPL-3.0 license
 **/

const {System} = require(__dirname+'/system.js');

class Storage
{
}

class Session
{
  userRef;
  clientRef;
  sessionRef;
  mdate;

  validate()
  {
    return false;
  }

  static getSession(req)
  {
    const storage = new Storage();
    // return storage.getSession();

    return new Session();
  }
}

class Auth
{
  static handleRequest(service)
  {
    const sess = Session.getSession(service.req);
    const page = service.url.pathname.substring('/admin/'.length);

    if(page == 'auth') {
      if(service.method == 'POST')
      {
        const post = await service.getStore();
        if(post.has('username')) {
          sess.userRef = post.get('username');
        }
      } else {
        if(!sess) return;
        else {
          sess.code = service.getParam('code');
          if(sess.validate()) service.redirect('/admin');
        }
        service.template = 'auth';
        service.compile();
      )
    } else {
      if(!sess || !sess.validate()) service.redirect('/admin/auth');
    }
  }
}

module.exports = Auth;
