
"use strict"

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
  var restRoutes = routeList.splice(1)

  async.parallelArray([
    function(callback) {
      currentRoute.handlerFactory(copyObject(config), function(err, handler) {
        if(err) return callback(err)

        if(currentRoute.type == 'static') {
          resultSpecs.staticRoutes[currentRoute.path] = handler
        } else if(currentRoute.type == 'dynamic') {
          resultSpecs.dynamicRoutes.push({
            handler: handler,
            matcher: currentRoute.matcher
          })
        } else if(currentRoute.type == 'default') {
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

    if(route.type == 'static') {
      if(staticRoutes[route.path]) throw new Error(
        'conflicting static routes found for path ' + route.path)

      staticRoutes[route.path] = route.handlerFactory

    } else if(route.type == 'default') {
      if(defaultRoute) throw new Error(
        'conflicting default route in route list')

      defaultRoute = route

    } else if(route.type != 'dynamic') {
      throw new Error('invalid route specification')
    }
  }
}

var createRouterHandlerFactory = function(routeList) {
  routeList = copyObject(routeList)
  validateRouteList(routeList)

  var routerHandlerFactory = function(config, callback) {
    var resultSpecs = {
      staticRoutes: { },
      dynamicRoutes: [ ]
    }

    routeListToSpecs(config, routeList, resultSpecs, function(err, routeSpecs) {
      if(err) return callback(err)

      createRouterHandler(routeSpecs, callback)
    })
  }

  return routerHandlerFactory
}

module.exports = {
  createRegexRouteMatcher: createRegexRouteMatcher,
  createRouterHandler: createRouterHandler,
  createRouterHandlerFactory: createRouterHandlerFactory
}