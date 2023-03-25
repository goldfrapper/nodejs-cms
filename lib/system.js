/**
 * Project: NodeJS-CMS
 *
 * (c) GPL-3.0 license
 **/

const Fs = require('fs');
const Path = require('path');

class System
{
  static #_cache;

  tier = 'local';
  path;

  static tiers = {
    local: {
      hostname: '127.0.0.1',
      port: 3000,
      sqlitedb: 'production.sqlite3'
    },
    trunk: {},
    test: {},
    demo: {},
    live: {},
  };

  static loadSystem()
  {
    if(typeof System.#_cache !== 'object') {
      System.#_cache = new System();
      System.#_cache.path = Path.dirname(__dirname);
      System.log('System loaded', 'SYS');
    }
    return System.#_cache;
  }

  static require( name, type )
  {
    let file;
    const dir = type? '/'+type+'/'+name+'/' : '/lib/';
    try {
      file = System.loadSystem().path + dir + name + '.js';
      Fs.accessSync(file, Fs.constants.R_OK);
      return require(file);
    }
    catch(exc) {
      System.log('Failed requirement: '+name, 'ERR');
      System.log('Path: '+file, 'ERR');
      System.log(exc, 'ERR');
    }
  }

  static async runTests()
  {
    const Plant = System.require('plant', 'plugin');

    const plants = await Plant.searchPlants('duizendblad');

    console.log(plants);
  }

  static get tier() {
    return System.tiers[System.loadSystem().tier];
  }

  static log(msg, sys) {
    let color = '0;37m';
    switch(sys) {
      case 'SYS': color = '1;34m'; break;
      case 'DB': color = '1;32m'; break;
      case 'ERR': color = '1;31m'; break;
    }
    console.log('\x1b[%s[%s] %s\x1b[0m', color, sys || '--', msg);
  }
}

module.exports.System = System;
