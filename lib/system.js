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

      // Load enabled plugins
      for(const f of System.getPlugins().keys()) {
        System.require(f,'plugin');
      }

      System.log('System loaded', 'SYS');
    }
    return System.#_cache;
  }

  static getPlugins()
  {
    const plugins = new Map();
    const path = System.loadSystem().path;
    try {
      Fs.accessSync(path+'/plugin', Fs.constants.R_OK);
      const dir = Fs.readdirSync(path+'/plugin', {withFileTypes:true});
      dir.forEach(e => {if(e.isDirectory()) {
        plugins.set(e.name, {
          name: e.name[0].toUpperCase()+e.name.substring(1),
          link: '/admin/plugins?plugin='+e.name,
          path: path+'/plugin/'+e.name,
        });
      }});
    } catch(exc) {
      throw new TypeError(exc);
    }
    // console.log(plugins);
    return plugins;
  }

  static require( name, type )
  {
    let file;
    const dir = type? '/'+type+'/'+name+'/' : '/lib/';
    try {
      file = System.loadSystem().path + dir + name + '.js';
      Fs.accessSync(file, Fs.constants.R_OK);
      if(type=='plugin') System.log('Plugin loaded: '+name, 'SYS');
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
    const s = System.require('plant','plugin');
    const {Content} = System.require('content');

    const plants = await s.getPlantsForContent('hsismvqkka');

// console.log(plants);

    const content = await Content.getContentByRef('irmtbdmuei');
    const taxonID = content.meta.get('taxonID');

    const plant = plants.get(taxonID)

    console.log(plant);

    // const {Content} = System.require('content');
    // const garden = Content.getContentByRef();

    // const x = await Content.getContentByRef('wwgrpyccxq');
    // console.log(x.meta);
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
