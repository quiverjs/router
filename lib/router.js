
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

var routeListToSpecs = function(config, routeList, callback) {
  var resultSpecs = {
    staticRoutes: { },
    dynamicRoutes: [ ]
  }

  async.each(routeList, function(currentRoute, callback) {
    var routeType = currentRoute.routeType
    var handlerBuilder = currentRoute.handlerBuilder

    handlerBuilder(copyObject(config), function(err, handler) {
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
  }, function(err) {
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
      return error(400, 'invalid route specification')
    }
  }
}

var createRouterHandlerFromRouteList = function(config, routeList, callback) {
  routeListToSpecs(config, routeList, function(err, routeSpecs) {
    if(err) return callback(err)

    createRouterHandler(routeSpecs, callback)
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
  createRouterHandlerFromRouteList: createRouterHandlerFromRouteList,
  createRouterHandlerBuilder: createRouterHandlerBuilder
}
