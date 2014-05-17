
'use strict'

var async = require('async')
var error = require('quiver-error').error
var copyObject = require('quiver-copy').copyObject

var defaultRouteHandler = function(args, inputStreamable, callback) {
  callback(error(404, 'Not Found'))
}

var createRegexRouteMatcher = function(regex, fields) {
  if(!fields) fields = [ ]

  return function(path) {
    var matches = path.match(regex)
    if(!matches) return null

    var args = { }
    for(var i=0; i<fields.length; i++) {
      args[fields[i]] = matches[i+1]
    }

    return args
  }
}

var createRouterHandler = function(routeIndex, callback) {
  routeIndex = copyObject(routeIndex)

  var staticRoutes = routeIndex.staticRoutes || { }
  var dynamicRoutes = routeIndex.dynamicRoutes || [ ]
  var defaultRoute = routeIndex.defaultRoute || defaultRouteHandler

  var handler = function(args, inputStreamable, callback) {
    var path = args.path
    if(!path) return callback(error(400, 'must provide a valid path'))

    if(staticRoutes[path]) {
      return staticRoutes[path](args, inputStreamable, callback)
    }

    for(var i=0; i<dynamicRoutes.length; i++) {
      var route = dynamicRoutes[i]
      var matchedArgs = route.matcher(path)

      if(matchedArgs) {
        for(var key in matchedArgs) {
          args[key] = matchedArgs[key]
        }
        return dynamicRoutes[i].handler(args, inputStreamable, callback)
      }
    }

    defaultRoute(args, inputStreamable, callback)
  }

  callback(null, handler)
}

var routeSpecToIndex = function(routeSpec, handler, routeIndex) {
  var routeType = routeSpec.routeType

  if(routeType == 'static') {
    routeIndex.staticRoutes[routeSpec.path] = handler

  } else if(routeType == 'dynamic') {
    routeIndex.dynamicRoutes.push({
      handler: handler,
      matcher: routeSpec.matcher
    })

  } else if(routeType == 'regex') {
    routeIndex.dynamicRoutes.push({
      handler: handler,
      matcher: createRegexRouteMatcher(
        routeSpec.regex, routeSpec.matchFields)
    })

  } else if(routeType == 'default') {
    routeIndex.defaultRoute = handler

  } else {
    return error(500, 'invalid route spec')

  }

  return null
}

var routeListToRouteIndex = function(config, routeList, callback) {
  var routeIndex = {
    staticRoutes: { },
    dynamicRoutes: [ ]
  }

  async.each(routeList, function(routeSpec, callback) {
    var handlerBuilder = routeSpec.handlerBuilder
    var handlerConfig = copyObject(config)

    handlerBuilder(handlerConfig, function(err, handler) {
      if(err) return callback(err)

      var err = routeSpecToIndex(routeSpec, handler, routeIndex)
      callback(err)
    })
  }, function(err) {
    if(err) return callback(err)
      
    callback(null, routeIndex)
  })
}

var validateRouteList = function(routeList) {
  var staticRoutes = { }
  var defaultRoute

  for(var i=0; i<routeList.length; i++) {
    var routeSpec = routeList[i]

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
}

var createRouterHandlerFromRouteList = function(config, routeList, callback) {
  routeListToRouteIndex(config, routeList, function(err, routeIndex) {
    if(err) return callback(err)

    createRouterHandler(routeIndex, callback)
  })
}

var createRouterHandlerBuilder = function(routeList, callback) {
  routeList = copyObject(routeList)

  var err = validateRouteList(routeList)
  if(err) throw err

  var routerHandlerBuilder = function(config, callback) {
    createRouterHandlerFromRouteList(config, routeList, callback)
  }

  return routerHandlerBuilder
}

module.exports = {
  createRegexRouteMatcher: createRegexRouteMatcher,
  createRouterHandler: createRouterHandler,
  validateRouteList: validateRouteList,
  routeListToRouteIndex: routeListToRouteIndex,
  createRouterHandlerFromRouteList: createRouterHandlerFromRouteList,
  createRouterHandlerBuilder: createRouterHandlerBuilder
}
