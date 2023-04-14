/**
 * Project: NodeJS-CMS
 *
 * (c) GPL-3.0 license
 **/

const {System} = require(__dirname+'/system.js');

/*
const mail = new Mail({
  from: '<goldfrapper@gmail.com>',
  to: 'tom.van.de.putte@mailfence.com',
  subject: 'een bijzonder verhaal',
  data: 'de inhoud van deze mail'
});

const smtp = new SMTPClient();
smtp.send(mail);
*/

class Mail
{
  constructor(options)
  {
    this.from = options.from || null;
    this.to = options.to || null;
    this.cc = options.cc || null;
    this.bcc = options.bcc || null;
    this.subject = options.subject || null;
    this.data = options.data || null;
  }
}

class SMTPClient
{
  constructor( port, host )
  {
    this.port = port | 25;
    this.host = host | 'localhost';
    this.net = require('net');
  }

  send( email )
  {
    // Setup message
    const from = email.from.match(/<[a-z0-9@.-]+>$/)[0];
    const to = email.to.match(/<[a-z0-9@.-]+>$/)[0];
    let msgs = [
      'HELO '+this.host,
      'MAIL FROM: '+from,
      'RCPT TO: '+to,
      'DATA',
      [
        'From: '+email.from,
        'To: '+email.to,
        'Subject: '+email.subject,
        '',
        ''+email.data
      ].join('\r\n')+'\r\n.',
      'QUIT'
    ];

    const client = this.net.createConnection(this.port, this.host);
    client.on('connect', () => { System.log('Connected to server','MAIL') });
    client.on('end', () => { System.log('Disconnected from server','MAIL') });
    client.setEncoding('utf8');

    client.on('data', (data) => {
      let msg = msgs.shift();
      // console.log(data);
      // console.log(msg);
      client.write(msg+'\r\n');
    });


  }
}
module.exports.SMTPClient = SMTPClient;
module.exports.Mail = Mail;
