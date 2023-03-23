/**
 * Project: NodeJS-CMS
 *
 * (c) GPL-3.0 license
 **/

const Exc = require(__dirname + '/libException.js');
const Path = require('path');
const sqlite3 = require('sqlite3');
const {System} = require(__dirname + '/system.js');

class SQLiteStorage {
  static #_db;
  // #_path;
  #_messages = [];
  #_testmode = false;

  getMessages( filter )
  {
    return this.#_messages;
  }

  _getInsertStatement( table, object )
  {
    const keys = Object.keys(object);
    const bind = Array(keys.length).fill('?').join(',');
    const sql = `
      INSERT OR REPLACE INTO ${table} (${keys.join(',')}) VALUES (${bind});`;

    return this._getStatement(sql);
  }

  _saveObject(table, object) {
    return this._getInsertStatement(table, object)
      .then(stat => {
        stat.run(Object.values(object));
        stat.finalize();
      })
  }

  _removeObject(table, object)
  {
    const tuples = Object.keys(object).map(e => e+'=?');
    const sql = `DELETE FROM ${table} WHERE ${tuples.join(' AND ')}`;
    return this._getPromise('run', sql, Object.values(object));
  }

  _logQuery(query) {
    console.log('\x1b[1;32m[DB] Query: %s\x1b[0m',
      query.replace(/\s+/ig,' ').substring(0,60));
  }

  async _getConnection() {

    // if(this.#_testmode) return new Promise((resolve, reject)=>{
    //   console.log('\x1b[1;32m[DB] Initiating fake connection\x1b[0m');
    //   return {};
    // });

    const database = System.tier.sqlitedb;
    const path = Path.normalize(__dirname + '/../data/'+database);

    return new Promise((resolve, reject)=>{
      if(typeof SQLiteStorage.#_db !== 'object') {
        console.log('\x1b[1;32m[DB] Initiating database connection\x1b[0m');

        console.log('\x1b[1;32m[DB] Database %s\x1b[0m',path);

        sqlite3.verbose();  // If debugging

        SQLiteStorage.#_db = new sqlite3.Database(path, sqlite3.OPEN_READWRITE,(err)=>{
          if(err === null) resolve(SQLiteStorage.#_db); else reject(err);
        });
      } else resolve(SQLiteStorage.#_db);
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

      this._logQuery(query);

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

      this._logQuery(sql);

      return db.prepare(sql);
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
