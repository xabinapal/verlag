;'use strict';

var verlag = require('./verlag');
var app = new verlag();

app.setServerOptions({
  port: 3000,
  databaseConnection: 'mongodb://eem:eem@localhost/eem_dev'
});

app.setAppOptions({
  appTitle: 'Editorial Evidencia Médica S.L.',
  masterView: 'page'
});

app.startServer();
