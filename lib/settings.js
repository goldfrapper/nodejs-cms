/**
 * Project: NodeJS-CMS
 *
 * (c) GPL-3.0 license
 **/


const {SQLiteStorage} = require(__dirname + '/SQLiteStorage.js');

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

  async saveSettings(settings)
  {
    const kv = new KeyValueInput();
    const stat = await this._getInsertStatement('settings_kv', kv);

    settings.forEach(obj => {
      stat.run(Object.values(obj));
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
      console.log('\x1b[1;32m[SYSTEM] Settings loaded\x1b[0m');
    }
    return Settings.#_cache;
  }

  static saveSettings(settings)
  {
    const storage = new Storage();
    return storage.saveSettings(settings);
  }
}

module.exports.Settings = Settings
