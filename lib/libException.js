/**
 * Project: NodeJS-CMS
 *
 * (c) GPL-3.0 license
 **/


//
// Very simple Exception/Notification Library for NodeJS
//
const util = require('util');

class Exception extends Error {
  constructor(message, ...args) {
    super(message);
    this.name = this.constructor.name;
  }
}

class InvalidArgument extends Exception {
  constructor( name, actual, expected = null) {
    if(expected) {
      var msg = 'Invalid Argument for %s: (%s)%s !== (%s)%s';
      super(util.format(msg, name, typeof actual, actual, typeof expected, expected));
    } else {
      var msg = 'Invalid Argument for %s: (%s)%s';
      super(util.format(msg, name, typeof actual, actual));
    }
  }
}

class RuntimeError extends Exception {
  constructor( msg, ...args ) {
    super(util.format(msg, ...args));
  }
}

module.exports.Exception = Exception;
module.exports.InvalidArgument = InvalidArgument;
module.exports.RuntimeError = RuntimeError;
