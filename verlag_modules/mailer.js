;(function() {
  'use strict';

  const name = 'mailer';
  const actions = [send];
  
  const nodemailer = require('nodemailer');
  const htmlToText = require('nodemailer-html-to-text').htmlToText;
  const pug = require('pug');

  function send(section, args, ctx) {
    let subject = args.get('subject');

    let formKeys = Object.keys(ctx.body)
      .filter(key => key.startsWith(args.get('prefix')))
      .reduce((map, key) => map.set(key.slice(args.get('prefix').length), ctx.body[key]), new Map());

    formKeys.forEach((key, value) => subject = subject.replace(`{${key}}`, value));

    let view = ctx.view(args.get('view'));
    let content = pug.renderFile(view, formKeys);

    let transporter = nodemailer.createTransport();
    transporter.use('compile', htmlToText());

    ctx.logger.log(ctx.logger.debug, 'sending mail...');

    transporter.sendMail({
      from: args.get('from'),
      to: args.get('to'),
      subject: subject,
      html: content
    }, function(err, info) {
      if (err) {
        ctx.logger.log(ctx.logger.error, 'can\'t send mail: {0}', err);
      } else {
        ctx.logger.log(ctx.logger.info, 'mail sent: {0}', info.response);
      }

      ctx.locals.modules.get('mailer').set('status', err);
      ctx.next();
    })
  }

  module.exports = factory => factory.create(name, actions);
})();
