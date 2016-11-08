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

  function getActivePageFactory(path) {
    path = path.split('/')[1] || '';
    return function(page) {
      return path === (page.index ? '' : page.path);
    }
  }

  app.use(function(req, res, next) {
    var getActivePage = getActivePageFactory(req.path);
    models.page.getAllPages(function(err, pages) {
      res.locals.pages = pages;
      res.locals.page = res.locals.pages.find(getActivePage);
      next();
    });
  });

  app.use(function(req, res, next) {
    if (res.locals.page) {
      res.locals.page.active = true;
      models.page.findById(res.locals.page._id, function(err, page) {
        res.locals.page = page;
        next();
      });
    } else {
      var err = new Error('Not found');
      err.status = 404;
      next(err);
    }
  });

  function parseCatalogRequest(req) {
    var catalog = req.path.replace(/\//g,  '').split('/');
    var category = (catalog.length >= 2 ? catalog[1] : null);
    var publication = (catalog.length >= 3 ? catalog[2] : null);

    models.category.getByPath(category, function(err, res) {
     category = res;
    });

    category && models.publication.getByCategory(category, function(err, res) {
      publication = res;
    });

    return Object.create({ category: category, publication: publication });
  }

  app.use(function(req, res, next) {
    if (res.locals.page.catalog) {
      var catalog = parseCatalogRequest(req);
      models.category.getAllCategories(function(err, categories) {
        res.locals.categories = categories;
        res.locals.catalog = catalog;
        if (catalog.category && catalog.publication) {
          res.locals.view = 'catalog-categories';
        } else if (catalog.category) {
          res.locals.view = 'catalog-publications';
        } else {
          res.locals.view = 'catalog-categories';
        }

        next();
      });
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
