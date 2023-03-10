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
  constructor() {
    super('production.sqlite3');
  }

  async getSettings(callback)
  {
    let sql = 'SELECT * FROM settings_kv;';
    return this._getPromise('all',sql)
      .catch( err => this._dbError(err) );
  }

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

  storeKeyValueInput( keyValueInput )
  {
    return _getInsertPromise( 'settings_kv', keyValueInput );
  }
}

// Manage simple key-value pair settings
class Settings extends Map
{
  // #_storage;
  // #_privateCall = true;

  static loadSettings()
  {
    const storage = new Storage(this);
    const s = new Settings();
    return storage.loadSettings(s);
  }

  static saveSettings(settings)
  {
    const storage = new Storage();
    return storage.saveSettings(settings);
  }
}

module.exports.Settings = Settings
