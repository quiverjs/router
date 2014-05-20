'use strict'

var error = require('quiver-error').error
var httpLib = require('./http')
var builderLib = require('./builder')
var indexLib = require('./route-index')

var getHandlerFromPath = function(path, routeIndex) {
  var staticHandler = routeIndex.staticRoutes[path]

  if(staticHandler) {
    return {
      matchedArgs: { },
      handler: staticHandler
    }
  }

  var dynamicRoutes = routeIndex.dynamicRoutes

  for(var i=0; i<dynamicRoutes.length; i++) {
    var route = dynamicRoutes[i]
    var matchedArgs = route.matcher(path)

    if(matchedArgs) {
      return {
        matchedArgs: matchedArgs,
        handler: dynamicRoutes[i].handler
      }
    }
  }

  if(routeIndex.defaultRoute) {
    return {
      matchedArgs: { },
      handler: routeIndex.defaultRoute
    }
  }

  return null
}

var createHttpRouterHandler = function(routeIndex) {
  var routerHandler = function(requestHead, requestStreamable, callback) {
    var path = httpLib.getPathFromRequestHead(requestHead)

    var res = getHandlerFromPath(path, routeIndex)
    if(!res) return callback(error(404, 'not found'))

    var handler = res.handler
    var matchedArgs = res.matchedArgs

    if(!requestHead.args) requestHead.args = { }
    var args = requestHead.args

    for(var key in matchedArgs) {
      args[key] = matchedArgs[key]
    }

    handler(requestHead, requestStreamable, callback)
  }

  return routerHandler
}

var createStreamRouterHandler = function(routeIndex) {
  var routerHandler = function(args, inputStreamable, callback) {
    var path = args.path

    var res = getHandlerFromPath(path, routeIndex)
    if(!res) return callback(error(404, 'not found'))

    var handler = res.handler
    var matchedArgs = res.matchedArgs

    for(var key in matchedArgs) {
      args[key] = matchedArgs[key]
    }

    handler(args, inputStreamable, callback)
  }

  return routerHandler
}

var createRouterHandleableFromRouteSpecs = function(routeSpecs) {
  var indexes = indexLib.routeSpecsToRouteIndexes(routeSpecs)

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