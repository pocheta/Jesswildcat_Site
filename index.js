const { log } = require('console');
var handlers = require('./handlers');
var router = require('./router');
var server = require('./server');

var routes = {
  '/': handlers.home,
  '/home': handlers.home,
  '/presse': handlers.presse,
  '/biographie': handlers.biographie,
  '/carte': handlers.carte,
  '/map': handlers.map,
  '/projet': handlers.projet,
  '/contact': handlers.contact,
  '/siteamis': handlers.siteamis,
  '/upload': handlers.upload,
  '/readJSON': handlers.readJSON,
  '/writeJSON': handlers.writeJSON,
  '_static': handlers.serveStatic
};

server.start(router.route, routes);
