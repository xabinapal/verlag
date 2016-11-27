;(function() {
  'use strict';

  const name = 'form';
  const actions = [show];

  const pug = require('pug');
  const recaptcha = require('recaptcha2');

  function show(section, args, ctx) {
    let view = ctx.view(args.get('view'));
    let captcha = args.get('recaptcha') && new recaptcha({
      siteKey: args.get('recaptcha').siteKey,
      secretKey: args.get('recaptcha').secretKey
    });

    section.content = pug.renderFile(view, { recaptcha: captcha && captcha.formElement() });
    ctx.next();
  }

  function validate(section, args, ctx) {
    let captcha = new recaptcha({
      siteKey: args.get('recaptcha').siteKey,
      secretKey: args.get('recaptcha').secretKey
    });

    captcha.validateRequest(req)
      .then(() => ctx.next())
      .catch(err => ctx.next(err));
  }

  module.exports = factory => factory.create(name, actions);
})();
