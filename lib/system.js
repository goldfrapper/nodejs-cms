/**
 * Project: NodeJS-CMS
 *
 * (c) GPL-3.0 license
 **/

class System
{
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

  static get tier() {
    return System.tiers.local;
  }
}

module.exports.System = System;
