/**
 * Project: NodeJS-CMS
 *
 * (c) GPL-3.0 license
 **/

const {System} = require(__dirname + '/system.js');
const {SQLiteStorage} = System.require('SQLiteStorage');

class KeyValueInput {
  key;
  value;
  name;
  type;
  note;

  constructor(key, value, name, type, note) {
    this.key = key;
    this.value = value;
    this.name = name;
    this.type = type;
    this.note = note;
  }
}

class Storage extends SQLiteStorage
{
  loadSettings(settings)
  {
    let sql = 'SELECT * FROM settings_kv;';
    return this._getPromise('all',sql)
      .then(rs => {
        rs.forEach(r=>{
          const kv = new KeyValueInput(r.key,r.value,r.name,r.type,r.note);
          settings.set(r.key, kv);
        });
      })
      .then(()=>{return settings})
      .catch( err => this._dbError(err) );
  }

  saveSettings(settings)
  {
    // const kv = new KeyValueInput();
    // const stat = await this._getInsertStatement('settings_kv', kv);
    // settings.forEach(obj => stat.run(Object.values(obj)) );


    const kv = new KeyValueInput();
    return this._getInsertStatement('settings_kv', kv).then(stat => {
      console.log('1');
      settings.forEach(obj => {
        console.log('2a');
        stat = stat.run(Object.values(obj), (x,i) => console.log(x,i));
        console.log('2b', stat);
      });
      console.log('3');
      // stat.finalize();
      // stat.reset();
      return stat;
    }).then(stat => {
      console.log('4');
      stat.finalize();
      return;
    });
  }
}

// Manage simple key-value pair settings
class Settings extends Map
{
  static #_cache;

  static loadSettings()
  {
    if(typeof Settings.#_cache !== 'object') {
      const storage = new Storage();
      const settings = new Settings();
      Settings.#_cache = storage.loadSettings(settings);
      System.log('Settings loaded','SYS');
    }
    return Settings.#_cache;
  }

  static saveSettings(data)
  {
    if(!(data instanceof Map)) throw new TypeError();

    const storage = new Storage();
    return this.loadSettings().then(s => {
      console.log('settings');
      for(const k of data.keys()) if(s.has(k)) s.get(k).value = data.get(k);
      console.log('loaded');
      return storage.saveSettings(s);
      console.log('and saved');
    });
  }
}

module.exports.Settings = Settings
