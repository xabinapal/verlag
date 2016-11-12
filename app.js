;(function() {
  'use strict';

  module.exports = function(locals, models) {
    var express = require('express');

    var path = require('path');
    var logger = require('morgan');
    var cookieParser = require('cookie-parser');
    var bodyParser = require('body-parser');

    var app = express();
    app.locals = locals;

    var Menu = require('./menu');
    var Router = require('./router');
    var Catalog = require('./catalog')(models);

    // view engine setup
    app.set('views', path.join(__dirname, 'views'));
    app.set('view engine', 'pug');

    app.use(logger('dev'));
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: false }));
    app.use(cookieParser());

    app.use(require('node-sass-middleware')({
      src: path.join(__dirname, 'public'),
      dest: path.join(__dirname, 'public'),
      indentedSyntax: true,
      sourceMap: true
    }));

    app.get('/robots.txt', function(req, res, next) {
      // TODO
      res.end();
    });

    app.get('/sitemap.xml', function(req, res, next) {
      // TODO
      res.end();
    });

    app.use(function(req, res, next) {
      res.locals.routes = Object.create({
        menus: undefined,
        current: undefined
      });

      models.menu.getAll()
        .then(menus => {
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

          res.locals.routes.current = pages.find(x => x.match(req.path));

          next();
        });
    });

    app.use(function(req, res, next) {
      if (res.locals.routes.current.page) {
        res.locals.routes.current.page.getData()
          .then(page => {
            res.locals.routes.current.page = page;
            next();
          });
      } else {
        var err = new Error('Not found');
        err.status = 404;
        next(err);
      }
    });

    app.use(function(req, res, next) {
      if (res.locals.routes.current.page.index) {
        res.locals.view = 'index';
        next();
      }
      if (res.locals.routes.current.page.catalog) {
        Catalog(req, res, next);
      } else {
        res.locals.view = 'page';
        next();
      }
    });

    app.use(function(req, res, next) {
      res.locals.ajax = req.headers['X-Requested-With'] === 'XMLHttpRequest';
      res.render(res.locals.view);
    });

    // error handler
    app.use(function(err, req, res, next) {
      // set locals, only providing error in development
      res.locals.message = err.message;
      res.locals.error = req.app.get('env') === 'development' ? err : {};

      // render the error page
      res.status(err.status || 500);
      res.render('error');
    });

    return app;
  };
})();
