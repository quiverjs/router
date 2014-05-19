'use strict'

var pathtoRegexp = require('path-to-regexp')

var addStaticRouteSpecToIndex = function(routeSpec, handler, routeIndex) {
  routeIndex.staticRoutes[routeSpec.path] = handler
}

var addDynamicRouteSpecToRouteIndex = function(routeSpec, handler, routeIndex) {
  var dynamicRoute = {
    handler: handler,
    matcher: routeSpec.matcher
  }

  routeIndex.dynamicRoutes.push(dynamicRoute)
}

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

var createRegexRouteMatcher = function(regex, fields) {
  if(!fields) fields = [ ]

  var matcher = function(path) {
    var matches = path.match(regex)
    if(!matches) return null

    var args = { }

    for(var i=0; i<fields.length; i++) {
      var key = fields[i]
      var match = matches[i+1]

      args[key] = match
    }

    return args
  }

  return matcher
}

var addRegexRouteSpecToIndex = function(routeSpec, handler, routeIndex) {
  var matcher = createRegexRouteMatcher(routeSpec.regex)

  var dynamicRoute = {
    handler: handler,
    matcher: matcher
  }

  routeIndex.dynamicRoutes.push(dynamicRoute)
}

var routeTypeTable = {
  'static': addStaticRouteSpecToIndex,
  'param': addParameterizedRouteSpecToIndex,
  'regex': addRegexRouteSpecToIndex,
  'dynamic': addDynamicRouteSpecToRouteIndex
}

module.exports = {
  routeTypeTable: routeTypeTable
  addStaticRouteSpecToIndex: addStaticRouteSpecToIndex,
  addDynamicRouteSpecToRouteIndex: addDynamicRouteSpecToRouteIndex,
  addParameterizedRouteSpecToIndex: addParameterizedRouteSpecToIndex,
  addRegexRouteSpecToIndex: addRegexRouteSpecToIndex,
  createParameterizedRouteMatcher: createParameterizedRouteMatcher,
  createRegexRouteMatcher: createRegexRouteMatcher
}