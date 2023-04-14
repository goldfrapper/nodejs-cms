/**
 * Project: NodeJS-CMS
 *
 * (c) GPL-3.0 license
 **/

const {System} = require(__dirname+'/system.js');
const {SQLiteStorage} = System.require('SQLiteStorage');
const {SMTPClient, Mail} = System.require('mail');

class Storage extends SQLiteStorage
{
  hasSession(session)
  {
    const values = ['sessionRef','clientRef','mdate'];
    const params = values.map(x => session[x]);
    let sql = 'SELECT COUNT(*) as c FROM auth_session ';
    sql += 'WHERE sessionRef=? AND clientRef=? AND mdate>?';

    return this._getPromise('all',sql,params).then(rows => {
      return rows[0].c? true : false;
    }).catch(err => this._dbError(err));
  }

  saveSession(session)
  {
    const values = ['sessionRef','clientRef','userRef','code','mdate'];
    let sql = 'INSERT OR REPLACE INTO auth_session ('+values.join(',')+') ';
    sql += 'VALUES(' + Array(values.length).fill('?').join(',') + ')';
    const params = values.map(x => session[x]);

    return this._getPromise('run',sql,params).then(res => {
      return (res.changes == 1)? true : false;
    }).catch(err => {
      if(err.code == 'SQLITE_CONSTRAINT') return false;
      else this._dbError(err)
    });
  }

  validateSession(session)
  {
    const params = [session.sessionRef, session.clientRef];
    let sql = 'UPDATE auth_session SET mdate=CURRENT_TIMESTAMP, code=\'\''
    sql += ' WHERE sessionRef=? AND clientRef=?';
    if(session.code) {
      sql += ' AND code=?';
      params.push(session.code);
    } else {
      sql += ' AND mdate>?';
      params.push(session.mtime);
    }
    return this._getPromise('run',sql,params).then(res => {
      return (res.changes == 1)? true : false;
    }).catch(err => {
      this._dbError(err)
    });
  }

  getUser(username)
  {
    const sql = 'SELECT * FROM auth_user WHERE username=?';
    return this._getPromise('all',sql,[username]).then(rows => {
      // console.log('user: '+username, rows);
      return rows.length? rows[0] : null;
    }).catch(err => this._dbError(err));
  }
}

class Session
{
  userRef;
  username;
  clientRef;
  sessionRef;
  code;
  mdate = 0;

  #_service;

  async sendLoginMail(email, token)
  {
    let link = 'http://'+System.tier.hostname+':'+System.tier.port+'/';

    // console.log(this.#_service.req);

    // return;

    const smtp = new SMTPClient();
    const mail = new Mail({
      from: '<dheerlijkheid@mailfence.com>',
      to: '<'+email+'>',
      subject: 'Verification code',
      data: link+'admin/auth?code='+token
    });
    smtp.send(mail);
  }

  async validate()
  {
    if(!this.sessionRef) return false;

    const storage = new Storage();
    const filter = new SessionFilter(this);

    if(this.username) {

      // Get user
      const user = await storage.getUser(this.username);
      if(!user) return false;
      this.userRef = user.userRef;

      // Get code
      this.code = Session.generateRef(20);

      // Store
      const r = await storage.saveSession(this);

      // TODO: Notify user session did not save

      this.sendLoginMail(user.email, this.code);

      return false;
    }

    else if(this.code) {
      const r = await storage.validateSession(this);
      console.log(r);

      if(r) return true;
    }

    this.mdate = Math.floor( (Date.now() - 20*60000) / 1000 );
    const valid = await storage.hasSession(this);

    if(valid) {
      const r = storage.validateSession(this);
      // const r = await storage.setDate(filter);

      // TODO Verify update

      return true;
    } else {
      console.log(this);
    }

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

    sess.#_service = service;

    //
    // Get/Set cookie (and return null if none)
    //
    const cookies = service.getCookies();
    if(!cookies.has('sess')) {
      const page = service.url.pathname.substring('/admin/'.length);
      if(page == 'auth') {
        service.setCookie('sess', Session.generateRef(10));
        System.log('Setting cookie');
      }
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

  // get username() {
  //
  //   console.log('Session:', this.#_sess);
  //   return this.#_sess.username;
  // }

  get params() {
    const s = this.#_sess;
    const params = [s.sessionRef, s.clientRef, s.mdate];
    if(s.code) params.push(s.code);
    return params;
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

    const isValid = await sess.validate();
    System.log('Authentication: '+(isValid? 'Ok' : 'Failed'));

    if(page == 'auth') {
      if(isValid) service.redirect('/admin');
      else {
        service.statusCode = 200;
        service.template = 'auth';
        service.compile();
      }
    } else {
      if(!isValid) service.redirect('/admin/auth');
      else return true;
    }
    return false;
  }
}

module.exports = Auth;
