;(function() {
  'use strict';

  const name = 'mailer';
  const actions = [send];
  
  const debug = require('debug')('verlag:modules:mailer');

  const nodemailer = require('nodemailer');
  const htmlToText = require('nodemailer-html-to-text').htmlToText;
  const pug = require('pug');

  function form(section, args, req, res, next) {
    let view = req.app.get('view getter')(args.view);
    section.content = pug.renderFile(view);
    next();
  }

  function send(section, args, req, res, next) {
    let subject = args.subject;

    let formKeys = Object.keys(req.body)
      .filter(key => key.startsWith(args.prefix))
      .reduce((dict, key) => {
        let k = key.slice(args.prefix.length);
        dict[k] = req.body[key];
        return dict;
      }, {});

    Object.keys(formKeys)
      .forEach(key => subject = subject.replace('{' + key + '}', formKeys[key]));

    let view = req.app.get('view getter')(args.view);
    let content = pug.renderFile(view, formKeys);

    let transporter = nodemailer.createTransport();
    transporter.use('compile', htmlToText());

    debug('sending mail...');

    transporter.sendMail({
      from: args.from,
      to: args.to,
      subject: subject,
      html: content
    }, function(err, info) {
      if (err) {
        debug('%s: can\' send mail: %s', req.id, error);
      } else {
        debug('%s: mail sent: %s', req.id, info.response)
      }

      res.locals.modules.mailer.status = err;
      next();
    })
  }

  module.exports = factory => factory.create(name, actions);
})();
