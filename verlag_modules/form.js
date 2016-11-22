;(function() {
  'use strict';

  const name = 'form';
  const actions = [show];

  const pug = require('pug');
  const recaptcha = require('recaptcha2');

  function show(section, args, logger, req, res, next) {
    let view = req.app.get('view getter')(args.get('view'));
    let captcha = args.get('recaptcha') && new recaptcha({
      siteKey: args.get('recaptcha').siteKey,
      secretKey: args.get('recaptcha').secretKey
    });
    section.content = pug.renderFile(view, { recaptcha: captcha.formElement() });
    next();
  }

  function validate(section, args, logger, req, res, next) {
    let captcha = new recaptcha({
      siteKey: args.get('recaptcha').siteKey,
      secretKey: args.get('recaptcha').secretKey
    });

    captcha.validateRequest(req)
      .then(() => {
        next();
      })
      .catch(err => {
        next(err);
      });
  }

  module.exports = factory => factory.create(name, actions);
})();
