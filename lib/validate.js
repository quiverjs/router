'use strict'

var validateRouteSpec = function(routeSpec) {
  var routeType = routeSpec.routeType
  
  if(routeType == 'static') {
    if(staticRoutes[routeSpec.path]) return error(500,
      'conflicting static routes found for path ' + routeSpec.path)

    staticRoutes[routeSpec.path] = routeSpec.handlerBuilder

  } else if(routeType == 'default') {
    if(defaultRoute) throw new Error(
      'conflicting default route in route list')

    defaultRoute = routeSpec

  } else if(routeType == 'regex') {
    // skip

  } else if(routeType == 'dynamic') {
    // skip

  } else {
    return error(400, 'invalid route specification')

  }
}

var validateRouteBuildSpecs = function(routeBuildSpecs) {

}

var validateRouteList = function(routeList) {

}

module.exports = {
  validateRouteBuildSpecs: validateRouteBuildSpecs,
  validateRouteList: validateRouteList
}