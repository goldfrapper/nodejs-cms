/**
 * Project: NodeJS-CMS
 *
 * (c) GPL-3.0 license
 **/

const Exc = require(__dirname + '/libException.js');
const Path = require('path');
const sqlite3 = require('sqlite3');

class SQLiteStorage {

  #_db;
  #_path;
  #_messages = [];
  #_testmode = false;

  constructor( database )
  {
    if(typeof(database) != 'string' || database.length == 0) {
      throw new Exc.InvalidArgument('SQLiteStorage.database', database);
    }
    if(database == 'testmode') this.#_testmode = true;
    this.#_path = Path.normalize(__dirname + '/../data/'+database);
  }

  getMessages( filter )
  {
    return this.#_messages;
  }

  async _getConnection() {

    if(this.#_testmode) return new Promise((resolve, reject)=>{
      console.log('\x1b[1;32m[DB] Initiating fake connection\x1b[0m');
      return {};
    });

    return new Promise((resolve, reject)=>{
      if(typeof this.#_db !== 'object') {
        console.log('\x1b[1;32m[DB] Initiating database connection\x1b[0m');

        console.log('\x1b[1;32m[DB] Database %s\x1b[0m',this.#_path);

        sqlite3.verbose();  // If debugging

        this.#_db = new sqlite3.Database(this.#_path, sqlite3.OPEN_READWRITE,(err)=>{
          if(err === null) resolve(this.#_db); else reject(err);
        });
      } else resolve(this.#_db);
    });
  }

  async _getPromise( call, query, params, callback )
  {
    // Validate call
    if(call.search(/^(run|get|each|all|exec)$/) == -1) {
      throw new Exc.InvalidArgument('_getPromise.call', call);
    }
    params = params || [];

    // Wait for connection
    const db = await this._getConnection();

    if(this.#_testmode) return new Promise((resolve, reject)=>{
      return { call: call, query: query, params: params }
    });

    // Return Promise
    return new Promise((resolve, reject)=>{
      //console.log(query, params);
      db[call](query,params,function(err,res) {
        if(err) reject(err,this);
        // console.log('M1');
        if(callback) callback(res || this);
        else resolve(res || this);
      },function(err,res) {
        if(err) reject(err,this);
        // console.log('M2');
        resolve(res || this);
      });
    });
  }

  async _getStatement( sql )
  {
    try {
      const db = await this._getConnection();

      if(this.#_testmode) return {sql: sql};

      const stat = db.prepare(sql);
      return stat;
    } catch(err) {
      this._dbError(err);
    }
  }

  _dbError(err)
  {
    this.#_messages.push(err);
    console.log('\x1b[1;31m[DB] Error %s\x1b[0m', err);
  }

  _dbWarning(err)
  {
    this.#_messages.push(err);
    console.log('\x1b[1;33m[DB] Warning %s\x1b[0m', err);
  }
}

module.exports.SQLiteStorage = SQLiteStorage
