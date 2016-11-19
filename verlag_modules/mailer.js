;(function() {
  'use strict';

  const name = 'mailer';
  const actions = [send];
  
  const debug = require('debug')('verlag:modules:mailer');

  const nodemailer = require('nodemailer');
  const htmlToText = require('nodemailer-html-to-text').htmlToText;
  const pug = require('pug');

  function send(section, args, req, res, next) {
    let subject = args.get('subject');

    let formKeys = Object.keys(req.body)
      .filter(key => key.startsWith(args.get('prefix')))
      .reduce((map, key) => map.set(key.slice(args.get('prefix').length), req.body[key]), new Map());

    formKeys.forEach((key, value) => subject = subject.replace('{' + key + '}', value));

    let view = req.app.get('view getter')(args.get('view'));
    let content = pug.renderFile(view, formKeys);

    let transporter = nodemailer.createTransport();
    transporter.use('compile', htmlToText());

    debug('sending mail...');

    transporter.sendMail({
      from: args.get('from'),
      to: args.get('to'),
      subject: subject,
      html: content
    }, function(err, info) {
      if (err) {
        debug('%s: can\'t send mail: %s', req.id, err);
      } else {
        debug('%s: mail sent: %s', req.id, info.response)
      }

      res.locals.modules.get('mailer').set('status', err);
      next();
    })
  }

  module.exports = factory => factory.create(name, actions);
})();
