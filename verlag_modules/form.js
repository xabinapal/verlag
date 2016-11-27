;(function() {
  'use strict';

  const name = 'form';
  const actions = [show];

  const recaptcha = require('recaptcha2');

  function show(ctx) {
    let args = ctx.arg('recaptcha');

    let captcha = args && new recaptcha({
      siteKey: args.siteKey,
      secretKey: args.secretKey
    });

    ctx.section.content = ctx.render({ recaptcha: captcha && captcha.formElement() });
    ctx.next();
  }

  function validate(ctx) {
    let args = ctx.arg('recaptcha');
    let captcha = new recaptcha({
      siteKey: args.siteKey,
      secretKey: args.secretKey
    });

    captcha.validateRequest(ctx.req)
      .then(() => ctx.next())
      .catch(err => ctx.next(err));
  }

  module.exports = factory => factory.create(name, actions);
})();
