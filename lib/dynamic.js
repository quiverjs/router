'use strict'

var addDynamicRouteSpecToRouteIndex = function(routeSpec, handler, routeIndex) {
  var dynamicRoute = {
    handler: handler,
    matcher: routeSpec.matcher
  }

  routeIndex.dynamicRoutes.push(dynamicRoute)
}

module.exports = {
  addDynamicRouteToRouteIndex: addDynamicRouteToRouteIndex
}