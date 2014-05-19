'use strict'

var copyObject = require('quiver-copy').copyObject
var configLib = require('quiver-config')
var mergeObjects = require('quiver-merge').mergeObjects
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
    routeSpec.urlBuilder = urlBuilderLib.createStaticUrlBuilder(routeSpec.path)
  }

  if(routeType == 'param') {
    routeSpec.urlBuilder = urlBuilderLib.pathToUrlBuilder(routeSpec.path)
  }

  return null
}

var createLoaderMiddlewareFromSpecs = function(middlewareSpecs) {
  var middlewares = middlewareSpecs.map(middlewareLib.createMiddlewareFromMiddlewareSpec)

  return middlewareLib.safeCombineMiddlewares(middlewares)
}

var routeListComponentToRouteBuildSpecs = function(componentSpec) {
  var routeBuildSpecs = copyObject(componentSpec.routeList)

  var routeListMiddleware = null

  if(componentSpec.middlewares) {
    routeListMiddleware = createLoaderMiddlewareFromSpecs(
      componentSpec.middlewares)
  }

  var routeItemToRouteSpec = function(routeItem) {
    var routeBuildSpec = copyObject(routeItem, {
      excludeFields: ['handler']
    })

    routeBuildSpec.handlerName = routeItem.handler

    addUrlBuilderToRouteSpec(routeBuildSpec)

    var handleableBuilder = createRouteHandleableBuilder(routeBuildSpec)

    if(routeListMiddleware) {
      handleableBuilder = middlewareLib.createMiddlewareManagedHandlerBuilder(
        routeListMiddleware, handleableBuilder)
    }

    routeBuildSpec.handleableBuilder = handleableBuilder

    return routeBuildSpec
  }

  var routeList = componentSpec.routeList

  var routeBuildSpecs = routeList.map(
  function(routeItem) {
    if(routeItem.handler) return routeItemToRouteSpec(routeItem)

    var routeBuildSpec = copyObject(routeItem, {
      excludeFields: ['handlers']
    })
    delete routeBuildSpec.handlers

    var methodItems = routeItem.handlers

    var methodBuildSpecs = methodItems.map(function(methodItem) {
      methodItem = mergeObjects([routeBuildSpec, methodItem])

      return routeItemToRouteSpec(methodItem)
    })

    routeBuildSpec.handleableBuilders = methodBuildSpecs
    return routeBuildSpec
  })

  return routeBuildSpecs
}

module.exports = {
  routeListComponentToRouteBuildSpecs: routeListComponentToRouteBuildSpecs
}