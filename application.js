var fhComponentMetrics = require('fh-component-metrics');
var mbaasApi = require('fh-mbaas-api');
var express = require('express');
var mbaasExpress = mbaasApi.mbaasExpress();
var cors = require('cors');

// list the endpoints which you want to make securable here
var securableEndpoints = [
  '/fhcache',
  '/fhdb',
  'fhstats'
];

var app = express();


// Enable METRICS
var metricsConf = {
	enabled: true,
	host: process.env.FH_METRICS_HOST || '209.132.178.93',
	port: process.env.FH_METRICS_PORT || 2003
};
var metricsTitle = 'dummy-loadtest-cloadapp';
var metrics = fhComponentMetrics(metricsConf);
if (metricsConf.enabled) {
    metrics.memory(metricsTitle, { interval: 2000 }, function(err) {
        if (err) console.warn(err);
    });
    metrics.cpu(metricsTitle, { interval: 1000 }, function(err) {
        if (err) console.warn(err);
    });
    app.use(fhComponentMetrics.timingMiddleware(metricsTitle, metricsConf));
}


// Enable CORS for all requests
app.use(cors());

// Note: the order which we add middleware to Express here is important!
app.use('/sys', mbaasExpress.sys(securableEndpoints));
app.use('/mbaas', mbaasExpress.mbaas);

// allow serving of static files from the public directory
app.use(express.static(__dirname + '/public'));

// Note: important that this is added just before your own Routes
app.use(mbaasExpress.fhmiddleware());

app.use('/fhdb', require('./lib/fhdb.js')());
app.use('/fhcache', require('./lib/fhcache.js')());
app.use('/fhstats', require('./lib/fhstats.js')());

// Important that this is last!
app.use(mbaasExpress.errorHandler());

var port = process.env.FH_PORT || process.env.OPENSHIFT_NODEJS_PORT || 8001;
var host = process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0';
app.listen(port, host, function() {
  console.log("App started at: " + new Date() + " on port: " + port);
});
