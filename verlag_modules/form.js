;(function() {
  'use strict';

  const recaptcha = require('recaptcha2');

  module.exports = Module => class form extends Module {
    _constructor() {
      this.show.context = Module.SECTION;
      this.validate.context = Module.ROUTER;
    }

    show(ctx) {
      let args = ctx.arg('recaptcha');

      let captcha = args && new recaptcha({
        siteKey: args.siteKey,
        secretKey: args.secretKey
      });

      ctx.content = ctx.render({ recaptcha: captcha && captcha.formElement() });
      ctx.next();
    }

    validate(ctx) {
      let args = ctx.arg('recaptcha');
      let captcha = new recaptcha({
        siteKey: args.siteKey,
        secretKey: args.secretKey
      });

      captcha.validateRequest(ctx.req)
        .then(() => ctx.next())
        .catch(err => ctx.next(err));
    }
  }
})();
