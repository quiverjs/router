'use strict'

var addStaticRouteSpecToIndex = function(routeSpec, handler, routeIndex) {
  routeIndex.staticRoutes[routeSpec.path] = handler
}

module.exports = {
  addStaticRouteSpecToIndex: addStaticRouteSpecToIndex
}