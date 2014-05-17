'use strict'

var staticLib = require('./static')
var paramLib = require('./param')
var regexLib = require('./regex')
var dynamicLib = require('./dynamic')
var httpLib = require('./http')

var routeTypeTable = {
  'static': staticLib.addStaticRouteSpecToIndex,
  'param': paramLib.addParameterizedRouteSpecToIndex,
  'regex': regexLib.addRegexRouteSpecToIndex,
  'dynamic': dynamicLib.addDynamicRouteSpecToRouteIndex
}

var createEmptyRouteIndex = function() {
  return {
    staticRoutes: { },
    dynamicRoutes: [ ]
  }
}

var createRouteIndexesFromRouteSpecs = function(routeSpecs) {
  var streamRouteIndex = createEmptyRouteIndex()
  var httpRouteIndex = createEmptyRouteIndex()

  routeSpecs.forEach(function(routeSpec) {
    var routeType = routeSpec.routeType
    var addRoute = routeTypeTable[routeType]
    if(!addRoute) throw new Error('invalid route type')

    var handleable = routeSpec.handleable

    if(handleable.toStreamHandler) {
      var streamHandler = handleable.toStreamHandler()
      addRoute(routeSpec, streamHandler, streamRouteIndex)

      if(!handleable.toHttpHandler) {
        var httpHandler = httpLib.trivialStreamToHttpHandler(streamHandler)
        addRoute(routeSpec, httpHandler, httpRouteIndex)
      }
    }

    if(handleable.toHttpHandler) {
      var httpHandler = handleable.toHttpHandler()

      addRoute(routeSpec, httpHandler, httpRouteIndex)
    }
  })

  return {
    streamRouteIndex: streamRouteIndex,
    httpRouteIndex: httpRouteIndex
  }
}

module.exports = {
  createRouteIndexesFromRouteSpecs: createRouteIndexesFromRouteSpecs
}