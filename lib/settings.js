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

  constructor(key, value, name, type, desc) {
    this.key = key;
    this.value = value;
    this.name = name;
    this.type = type;
    this.note = note;
  }
}

class Storage extends SQLiteStorage
{
  #_settings;

  constructor(settings) {
    super('production.sqlite3');
    this.#_settings = settings;
  }

  async getSettings(callback)
  {
    let sql = 'SELECT * FROM settings_kv;';

    return this._getPromise('all',sql,[],callback)
      .catch( err => this._dbError(err) );
  }
}

// Manage simple key-value pair settings
class Settings extends Map
{
  #_storage;

  static loadSettings() {
    const s = new Settings();
    s.#_storage.getSettings(ret => console.log('ret')).then(row => {
      console.log(row);
    });
    return s;
  }

  constructor() {
    super();

    this.#_storage = new Storage(this);

    // TODO Get settings from datastore

    const settings = [
      {key:'site_title', name:'Site title', desc:'Site title', value:'My Title'},
      {key:'site_subtitle', name:'Site subtitle', desc:'Site subtitle', value:'My Subtitle'}
    ];
    settings.forEach(i=>{this.set(i.key,i)});
  }

  clear() {
    // Clear() should never be used
    return;
  }

  delete(key) {
    // TODO Remove from datastore
    super.set(key);
  }

  set(key, value) {
    // TODO Add to datastore
    super.set(key, value);
  }
}

module.exports.Settings = Settings
