/**
 * Project: NodeJS-CMS
 *
 * (c) GPL-3.0 license
 **/

const {System} = require(__dirname+'/system.js');
const {SQLiteStorage} = System.require('SQLiteStorage');

class Storage extends SQLiteStorage
{
  static #_instance;

  static getInstance() {
    if(!self.#_instance) self.#_instance = new Storage();
    return self.#_instance;
  }

  static hasSession(filter) {

    let sql = 'SELECT * FROM auth_session';
    sql += 'WHERE sessRef=? AND clientRef=? AND mdate>?';'

    if(filter.code) sql += ' AND code=?';

    // WHERE sessRef=? AND clientRef=? AND mdate>? AND code=?

    console.log(filter.where());
  }

  static saveSession(filter) {

    INSERT INTO auth_session (sessionRef,clientRef,userRef,code)
    VALUES (?,?,?,?)

    console.log(filter.where());
  }

  static setDate(filter) {

    UPDATE auth_session SET mdate=CURRENT_TIMESTAMP
    WHERE sessRef=? AND clientRef=?

    console.log(filter.where());
  }

  static getUser(filter) {

    SELECT * FROM auth_user WHERE username=?

    console.log(filter.where());
  }
}

class Session
{
  userRef;
  username;
  clientRef;
  sessionRef;
  code;
  mdate;

  async validate()
  {
    if(!this.sessionRef) return false;

    const storage = new Storage();
    const filter = new SessionFilter(this);

    if(this.username)
    {
      this.mdate = Date.now() - 10*60000;
      this.code = this.generateRef(20);

      const user = Storage.getUser(filter);
      this.userRef = user.userRef;

      const r = await Storage.saveSession(filter);


      // TODO => Send email to user.email

    }
    else if(Storage.hasSession(filter)) {
      this.mdate = Date.now() - 20*60000;
      const r = await Storage.setDate(filter);
      // TODO Verify update
      return true;
    }

    console.log(this);
    return false;
  }

  static generateRef(length)
  {
    return Array.from({length:length},()=>
      String.fromCharCode(Math.floor((Math.random()*26)+97))
    ).join('');
  }

  static async getSession(service)
  {
    const sess = new Session();

    //
    // Get cookie (or return null if none)
    //
    const cookies = service.getCookies();
    if(!cookies.has('sess')) {
      service.setCookie('sess', Session.generateRef(10));
      return null;
    }
    sess.sessionRef = cookies.get('sess');

    //
    // Calc clientRef
    //
    const agent = service.req.headers['user-agent'];
    const addr = service.req.socket.address();

    const {createHash} = await import('node:crypto');
    const hash = createHash('sha256');
    hash.update( agent+addr.address+addr.port );
    sess.clientRef = hash.digest('hex');

    //
    // Get code or userRef
    //
    if(service.method == 'POST') {
      const post = await service.getStore();
      if(post.has('username')) {
        sess.username = post.get('username');
      }
    } else {
      sess.code = service.getParam('code');
    }

    return sess;
  }
}

class SessionFilter extends Session
{
  #_sess;
  constructor(session) {
    super();
    this.#_sess = session;
  }

  where() {
    const s = this.#_sess;
    const r = {
      sql: 'WHERE sessRef=? AND clientCode=? AND strftime(\'%s\')>?',
      params: [s.sessionRef, s.clientRef, s.mdate]
    }
    if(s.code) {
      r.sql += ' AND code=?';
      r.params.push(s.code);
    }
    return r
  }
}

class Auth
{
  static Session = Session;

  static async handleRequest(service)
  {
    const sess = await Session.getSession(service);
    const page = service.url.pathname.substring('/admin/'.length);

    if(page == 'auth') {

      if(sess && sess.validate()) {
        // if()
        service.redirect('/admin');
      }

      service.template = 'auth';
      service.compile();
    } else {
      if(!sess || !sess.validate()) service.redirect('/admin/auth');
    }
  }
}

module.exports = Auth;
