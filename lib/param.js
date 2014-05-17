'use strict'

var pathtoRegexp = require('path-to-regexp')

var createParameterizedRouteMatcher = function(parameterizedPath) {
  var keyIndex = []

  var regex = pathtoRegexp(parameterizedPath, keyIndex)

  var matcher = function(path) {
    var matches = regex.exec(path)
    if(!matches) return null

    var args = { }

    for(var i=1; i<matches.length; i++) {
      var key = keyIndex[i-1]
      args[key] = matches[i]
    }

    return args
  }

  return matcher
}

var addParameterizedRouteSpecToIndex = function(routeSpec, handler, routeIndex) {
  var matcher = createParameterizedRouteMatcher(routeSpec.path)

  var dynamicRoute = {
    handler: handler,
    matcher: matcher
  }

  routeIndex.dynamicRoutes.push(dynamicRoute)
}

module.exports = {
  createParameterizedRouteMatcher: createParameterizedRouteMatcher,
  addParameterizedRouteSpecToIndex: addParameterizedRouteSpecToIndex
}