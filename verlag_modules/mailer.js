;(function() {
  'use strict';

  const name = 'mailer';
  const actions = [send];
  
  const nodemailer = require('nodemailer');
  const htmlToText = require('nodemailer-html-to-text').htmlToText;

  module.exports = Module => class Mailer extends Module {
    constructor() {
      this.send.context = Module.PAGE;
    }

    send(ctx) {
      let subject = ctx.arg('subject');

      let formKeys = Object.keys(ctx.body)
        .filter(key => key.startsWith(ctx.arg('prefix')))
        .reduce((map, key) => map.set(key.slice(ctx.arg('prefix').length), ctx.body[key]), new Map());

      formKeys.forEach((key, value) => subject = subject.replace(`{${key}}`, value));

      let content = ctx.render(formKeys);

      let transporter = nodemailer.createTransport();
      transporter.use('compile', htmlToText());

      ctx.logger.log(ctx.logger.debug, 'sending mail...');

      transporter.sendMail({
        from: ctx.arg('from'),
        to: ctx.arg('to'),
        subject: subject,
        html: content
      }, function(err, info) {
        if (err) {
          ctx.logger.log(ctx.logger.error, 'can\'t send mail: {0}', err);
        } else {
          ctx.logger.log(ctx.logger.info, 'mail sent: {0}', info.response);
        }

        ctx.set('status', err);
        ctx.next();
      });
    }
  }
})();
