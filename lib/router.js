
'use strict'

var error = require('quiver-error').error
var copyObject = require('quiver-copy').copyObject
var async = require('quiver-async-tasks')

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

var createRouterHandler = function(routeSpecs, callback) {
  routeSpecs = copyObject(routeSpecs)

  var staticRoutes = routeSpecs.staticRoutes || { }
  var dynamicRoutes = routeSpecs.dynamicRoutes || [ ]
  var defaultRoute = routeSpecs.defaultRoute || defaultRouteHandler

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

var routeListToSpecs = function(config, routeList, resultSpecs, callback) {
  if(routeList.length == 0) return callback(null)

  var currentRoute = routeList[0]
  var restRoutes = routeList.slice(1)

  async.parallelArray([
    function(callback) {
      currentRoute.handlerBuilder(copyObject(config), function(err, handler) {
        if(err) return callback(err)

        var routeType = currentRoute.routeType

        if(routeType == 'static') {
          resultSpecs.staticRoutes[currentRoute.path] = handler
        } else if(routeType == 'regex') {
          resultSpecs.dynamicRoutes.push({
            handler: handler,
            matcher: createRegexRouteMatcher(
              currentRoute.regex, currentRoute.matchFields)
          })
        } else if(routeType == 'dynamic') {
          resultSpecs.dynamicRoutes.push({
            handler: handler,
            matcher: currentRoute.matcher
          })
        } else if(routeType == 'default') {
          resultSpecs.defaultRoute = handler

        } else {
          return callback(error(500, 'invalid route specs'))
        }

        callback(null)
      })
    }, 
    function(callback) {
      routeListToSpecs(config, restRoutes, resultSpecs, callback)
    }
  ], function(err) {
    if(err) return callback(err)

    callback(null, resultSpecs)
  })
}

var validateRouteList = function(routeList) {
  var staticRoutes = { }
  var defaultRoute

  for(var i=0; i<routeList.length; i++) {
    var route = routeList[i]

    var routeType = route.routeType
    if(routeType == 'static') {
      if(staticRoutes[route.path]) throw new Error(
        'conflicting static routes found for path ' + route.path)

      staticRoutes[route.path] = route.handlerBuilder

    } else if(routeType == 'default') {
      if(defaultRoute) throw new Error(
        'conflicting default route in route list')

      defaultRoute = route

    } else if(routeType == 'regex') {

    } else if(routeType == 'dynamic') {

    } else {
      throw new Error('invalid route specification')
    }
  }
}

var createRouterHandlerBuilder = function(routeList) {
  routeList = copyObject(routeList)
  validateRouteList(routeList)

  var routerHandlerBuilder = function(config, callback) {
    var resultSpecs = {
      staticRoutes: { },
      dynamicRoutes: [ ]
    }

    routeListToSpecs(config, routeList, resultSpecs, function(err, routeSpecs) {
      if(err) return callback(err)

      createRouterHandler(routeSpecs, callback)
    })
  }

  return routerHandlerBuilder
}

module.exports = {
  createRegexRouteMatcher: createRegexRouteMatcher,
  createRouterHandler: createRouterHandler,
  createRouterHandlerBuilder: createRouterHandlerBuilder
}
