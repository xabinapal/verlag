;(function() {
  'use strict';

  module.exports = (locals, modules, models) => {
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

    app.set('view getter', view => {
      view = path.join(app.get('views'), view);
      !path.extname(view) && (view += '.' + app.get('view engine'));
      return view;
    });

    app.disable('x-powered-by');

    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: false }));

    app.use((req, res, next) => {
      req.id = uuid.v4();
      req.models = models;
      res.locals.modules = new Map();
      modules.list().forEach(m => res.locals.modules.set(m, new Map()));
      next();
    });

    app.get('/robots.txt', (req, res, next) => {
      debug('%s: processing request: /robots.txt', req.id);
      // TODO
      res.end();
    });

    app.get('/sitemap.xml', (req, res, next) => {
      debug('%s: processing request: /sitemap.xml', req.id);
      // TODO
      res.end();
    });

    app.use((req, res, next) => {
      debug('%s: processing request: %s', req.id, req.path);

      res.locals.routes = Object.create({
        menus: undefined,
        current: undefined
      });

      models.menu.getAll().then(menus => {
        res.locals.routes.menus = menus
          .map(menu => new Menu(menu))
          .reduce((map, menu) => map.set(menu.menu.key, menu), new Map());

        return models.page.getAll();
      }).then(pages => {
        let menus = [...res.locals.routes.menus.values()]
          .reduce((map, menu) => map.set(menu.menu._id.toHexString(), menu), new Map());

        pages = pages.map(page => new Router(page));
        pages.forEach(page => {
          page.page.menus.forEach(menu => menus.get(menu.menu.toHexString()).addPage(page));
        });

        res.locals.routes.current = pages.find(x => x.match(req));
        next();
      });
    });

    app.use((req, res, next) => {
      let route = res.locals.routes.current;
      if (route) {
        route.page.getData().then(page => {
          let content = page.content.map(section => {
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
        let err = new Error('Not found');
        err.status = 404;
        next(err);
      }
    });

    app.use(modules.inject);

    app.use((req, res, next) => {
      res.locals.ajax = req.headers['X-Requested-With'] === 'XMLHttpRequest';

      if (res.locals.ajax) {
        debug('%s: rendering ajax request %s', req.id, req.path);
      } else {
        debug('%s: rendering request %s', req.id, req.path);
      }

      res.render('page');
    });

    // error handler
    app.use((err, req, res, next) => {
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
