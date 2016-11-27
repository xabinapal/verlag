;(function() {
  'use strict';

  module.exports = (locals, logger, modules, models) => {
    let appLogger = logger.create('app', true);

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

    app.use(logger.requestLogger);
    app.use(logger.responseLogger);

    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: false }));

    app.use((req, res, next) => {
      req.logger = logger;
      req.models = models;
      res.locals.modules = new Map();
      modules.list().forEach(m => res.locals.modules.set(m, new Map()));
      next();
    });

    app.get('/robots.txt', (req, res, next) => {
      appLogger.log(appLogger.info, 'processing request: /robots.txt');
      // TODO
      res.end();
    });

    app.get('/sitemap.xml', (req, res, next) => {
      appLogger.log(appLogger.info, 'processing request: /sitemap.xml');
      // TODO
      res.end();
    });

    app.use((req, res, next) => {
      appLogger.log(appLogger.info, 'processing request: {0}', req.path);

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

        let current = pages.find(x => x.match(req));
        res.locals.routes.current = current;
        req.router = current;
        next();
      });
    });

    app.use((req, res, next) => {
      if (req.router) {
        req.router.page.getData().then(page => {
          let content = page.content.map(section => {
            if (req.router.evaluateConditions(section.conditions)) {
              section.content = escapeHtml(section.content);
              return section;
            }

            return null;
          }).filter(section => section !== null);

          page.content = content;
          req.router.page = page;
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
        appLogger.log(appLogger.info, 'rendering ajax request {0}', req.path);
      } else {
        appLogger.log(appLogger.info, 'rendering request {0}', req.path);
      }

      res.render('page');
    });

    app.use((err, req, res, next) => {
      appLogger.log(appLogger.warn, 'error processing request {0}: {1} {2}', req.path, err.status, err.message);
      res.locals.message = err.message;
      res.locals.error = req.app.get('env') === 'development' ? err : {};

      res.status(err.status || 500);
      res.render('error');
    });

    return app;
  };
})();
