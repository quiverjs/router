'use strict'

var httpLib = require('quiver-http')

var createEmptyRouteIndex = function() {
  return {
    staticRoutes: { },
    dynamicRoutes: [ ]
  }
}

var addRouteToIndex = function(routeSpec, handler, routeIndex) {
  var routeType = routeSpec.routeType

  if(routeType == 'static') {
    routeIndex.staticRoutes[routeSpec.path] = handler

  } else if(routeType == 'dynamic') {
    var dynamicRoute = {
      handler: handler,
      matcher: routeSpec.matcher
    }

    routeIndex.dynamicRoutes.push(dynamicRoute)

  } else if(routeType == 'default') {
    routeIndex.defaultRoute = handler

  } else {
    throw new Error('invalid route type')
  }
}

var routeSpecsToRouteIndexes = function(routeSpecs) {
  var streamRouteIndex = createEmptyRouteIndex()
  var httpRouteIndex = createEmptyRouteIndex()

  routeSpecs.forEach(function(routeSpec) {
    var routeType = routeSpec.routeType

    var handleable = routeSpec.handleable

    if(handleable.toStreamHandler) {
      var streamHandler = handleable.toStreamHandler()
      addRouteToIndex(routeSpec, streamHandler, streamRouteIndex)

      if(!handleable.toHttpHandler) {
        var httpHandler = httpLib.trivialStreamToHttpHandler(streamHandler)
        addRouteToIndex(routeSpec, httpHandler, httpRouteIndex)
      }
    }

    if(handleable.toHttpHandler) {
      var httpHandler = handleable.toHttpHandler()

      addRouteToIndex(routeSpec, httpHandler, httpRouteIndex)
    }
  })

  return {
    streamRouteIndex: streamRouteIndex,
    httpRouteIndex: httpRouteIndex
  }
}

module.exports = {
  routeSpecsToRouteIndexes: routeSpecsToRouteIndexes
}