'use strict'

var copyObject = require('quiver-copy').copyObject
var middlewareLib = require('quiver-middleware')
var builderLib = require('./builder')
var urlBuilderLib = require('./url-builder')

var createRouteHandleableBuilder = function(routeBuildSpec) {
  var handlerName = routeBuildSpec.handlerName
  var routeType = routeBuildSpec.routeType
  var urlBuilder = routeBuildSpec.urlBuilder

  var handleableBuilder = function(config, callback) {
    var currentUrlBuilder = urlBuilder

    if(config.urlBuilder) {
      if(urlBuilder) {
        currentUrlBuilder = urlBuilderLib.combineUrlBuilders(
          config.urlBuilder, currentUrlBuilder)
      } else {
        currentUrlBuilder = null
      }
    }

    config.urlBuilder = currentUrlBuilder

    configLib.loadHandleable(config, handlerName, function(err, handleable) {
      if(err) return callback(err)
      
      if(!handleable.urlBuilder && currentUrlBuilder) {
        handleable.urlBuilder = currentUrlBuilder
      }

      callback(null, handleable)
    })
  }

  return handleableBuilder
}

var addUrlBuilderToRouteSpec = function(routeSpec) {
  if(routeSpec.urlBuilder) return 

  var routeType = routeSpec.routeType

  if(routeType == 'static') {
    routeSpec.urlBuilder = createStaticUrlBuilder(routeSpec.path)
  }

  if(routeType == 'param') {
    routeSpec.urlBuilder = pathToUrlBuilder(routeSpec.path)
  }

  return null
}

var routeListComponentToRouteBuildSpecs = function(componentSpec) {
  var routeBuildSpecs = copyObject(componentSpec.routeList)

  var routeListMiddleware = null

  if(componentSpec.middlewares) {
    routeListMiddleware = middlewareLib.createLoaderMiddlewareFromSpecs(
      componentSpec.middlewares)
  }

  routeBuildSpecs.forEach(function(routeBuildSpec) {
    routeBuildSpec.handlerName = routeBuildSpec.handler
    delete routeBuildSpec.handler

    addUrlBuilderToRouteSpec(routeBuildSpec)

    var handleableBuilder = createRouteHandleableBuilder(routeBuildSpec)

    if(routeListMiddleware) {
      handleableBuilder = middlewareLib.createMiddlewareManagedHandlerBuilder(
        routeListMiddleware, handleableBuilder)
    }

    routeBuildSpec.handleableBuilder = handleableBuilder
  })

  return routeBuildSpecs
}

module.exports = {
  routeItemToRouteSpec: routeItemToRouteSpec,
  routeListComponentToRouteSpecs: routeListComponentToRouteSpecs
}