'use strict'

var httpLib = require('./http')
var builderLib = require('./builder')
var indexLib = require('./route-index')

var getHandlerFromPath = function(path, routeIndex) {
  var staticRoute = routeIndex.staticRoutes[path]
  if(staticRoute) return staticRoute

  var dynamicRoutes = routeIndex.dynamicRoutes

  for(var i=0; i<dynamicRoutes.length; i++) {
    var route = dynamicRoutes[i]
    var matchedArgs = route.matcher(path)

    if(matchedArgs) {
      for(var key in matchedArgs) {
        args[key] = matchedArgs[key]
      }
      return dynamicRoutes[i].handler
    }
  }

  return routeIndex.defaultRoute
}

var createHttpRouterHandler = function(routeIndex) {
  var handler = function(requestHead, requestStreamable, callback) {
    var path = httpLib.getPathFromRequestHead(requestHead)

    var handler = getHandlerFromPath(path, routeIndex)
    if(!handler) return callback(error(404, 'not found'))

    handler(requestHead, requestStreamable, callback)
  }

  return handler
}

var createStreamRouterHandler = function(routeIndex) {
  var handler = function(args, inputStreamable, callback) {
    var path = args.path

    var handler = getHandlerFromPath(path, routeIndex)
    if(!handler) return callback(error(404, 'not found'))

    handler(args, inputStreamable, callback)
  }

  return handler
}

var createRouterHandleableFromRouteSpecs = function(routeSpecs) {
  var indexes = indexLib.createRouteIndexesFromRouteSpecs(routeSpecs)

  var streamHandler = createStreamRouterHandler(indexes.streamRouteIndex)
  var httpHandler = createHttpRouterHandler(indexes.httpRouteIndex)

  var handleable = {
    toStreamHandler: function() {
      return streamHandler
    },
    toHttpHandler: function() {
      return httpHandler
    }
  }

  return handleable
}

module.exports = {
  createHttpRouterHandler: createHttpRouterHandler,
  createStreamRouterHandler: createStreamRouterHandler,
  createRouterHandleableFromRouteSpecs: createRouterHandleableFromRouteSpecs
}