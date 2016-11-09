;(function() {
  'use strict';

  var express = require('express');
  var mongoose = require('mongoose');

  var path = require('path');
  var favicon = require('serve-favicon');
  var logger = require('morgan');
  var cookieParser = require('cookie-parser');
  var bodyParser = require('body-parser');

  mongoose.connect('mongodb://localhost/verlag');

  var app = express();
  var db = mongoose.connection;

  var models = Object.create(null);
  db.on('error', console.error.bind(console, 'connection error:'));
  db.once('open', function() {
    ['page', 'category', 'publication'].forEach(function(model) {
      models[model] = require('./models/' + model)(mongoose);
    });
  });

  var router = require('./router');
  var catalog = require('./catalog')(models);

  // view engine setup
  app.set('views', path.join(__dirname, 'views'));
  app.set('view engine', 'pug');

  // uncomment after placing your favicon in /public
  //app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
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
    models.page.getAllPages(function(err, pages) {
      res.locals.pages = pages.map(router);
      res.locals.current = res.locals.pages.find(x => x.match(req.path));
      next();
    });
  });

  app.use(function(req, res, next) {
    if (res.locals.current.page) {
      models.page.findById(res.locals.current.page._id, function(err, page) {
        res.locals.current.page = page;
        next();
      });
    } else {
      var err = new Error('Not found');
      err.status = 404;
      next(err);
    }
  });

  app.use(function(req, res, next) {
    if (res.locals.current.page.catalog) {
      catalog(req, res, next);
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

  module.exports = app;
})();
