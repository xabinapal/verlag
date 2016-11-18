;(function() {
  'use strict';

  module.exports = function(locals, modules, models) {
    const debug = require('debug')('verlag:app');
    const uuid = require('uuid');

    const bodyParser = require('body-parser');
    const escapeHtml = require('escape-html');
    const express = require('express');
    const path = require('path');

    const app = express();
    app.locals = locals;

    const Menu = require('./menu');
    const Router = require('./router');

    app.set('view getter', function(view) {
      view = path.join(app.get('views'), view);
      !path.extname(view) && (view += '.' + app.get('view engine'));
      return view;
    });

    app.disable('x-powered-by');

    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: false }));

    app.use(function(req, res, next) {
      req.id = uuid.v4();
      req.models = models;
      res.locals.modules = Object.create({});
      Object.keys(modules).forEach(m => res.locals.modules[m] = Object.create({}));
      next();
    });

    app.get('/robots.txt', function(req, res, next) {
      debug('%s: processing request: /robots.txt', req.id);
      // TODO
      res.end();
    });

    app.get('/sitemap.xml', function(req, res, next) {
      debug('%s: processing request: /sitemap.xml', req.id);
      // TODO
      res.end();
    });

    app.use(function(req, res, next) {
      debug('%s: processing request: %s', req.id, req.path);

      res.locals.routes = Object.create({
        menus: undefined,
        current: undefined
      });

      models.menu.getAll().then(menus => {
        res.locals.routes.menus = menus
          .map(Menu)
          .reduce((d, m) => ((d[m.menu.key] = m) && d), {});

        return models.page.getAll();
      }).then(pages => {
        var menus = Object.keys(res.locals.routes.menus)
          .map(menu => res.locals.routes.menus[menu])
          .reduce((d, m) => ((d[m.menu._id] = m) && d), {});

        pages = pages.map(Router);
        pages.forEach(page => {
          page.page.menus && page.page.menus.forEach(menu => {
            menus[menu.menu].addPage(page);
          });
        });

        res.locals.routes.current = pages.find(x => x.match(req));
        next();
      });
    });

    app.use(function(req, res, next) {
      var route = res.locals.routes.current;
      if (route) {
        route.page.getData().then(page => {
          var content = page.content.map(section => {
            section.content = escapeHtml(section.content);
            return (section.conditions || []).find(x => !route.evaluateCondition(x))
              ? null
              : section;
          }).filter(section => section !== null);

          page.content = content;
          res.locals.routes.current.page = page;
          next();
        });
      } else {
        var err = new Error('Not found');
        err.status = 404;
        next(err);
      }
    });

    app.use(modules.inject);

    app.use(function(req, res, next) {
      res.locals.ajax = req.headers['X-Requested-With'] === 'XMLHttpRequest';

      if (res.locals.ajax) {
        debug('%s: rendering ajax request %s', req.id, req.path);
      } else {
        debug('%s: rendering request %s', req.id, req.path);
      }

      res.render('page');
    });

    // error handler
    app.use(function(err, req, res, next) {
      debug('%s: error processing request %s: %s %s', req.id, req.path, err.status, err.message);
      // set locals, only providing error in development
      res.locals.message = err.message;
      res.locals.error = req.app.get('env') === 'development' ? err : {};

      res.status(err.status || 500);
      res.render('error');
    });

    return app;
  };
})();
