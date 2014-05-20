'use strict'

var copyObject = require('quiver-copy').copyObject
var configLib = require('quiver-config')
var mergeObjects = require('quiver-merge').mergeObjects
var middlewareLib = require('quiver-middleware')

var matcherLib = require('./matcher')
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

var compileDynamicRoute = function(routeSpec) {
  var routeType = routeSpec.routeType

  if(routeType == 'param') {
    routeSpec.routeType = 'dynamic'
    routeSpec.matcher = matcherLib.createParamRouteMatcher(routeSpec.path)

    delete routeSpec.path

  } else if(routeType == 'regex') {
    routeSpec.routeType = 'dynamic'
    routeSpec.matcher = matcherLib.createRegexRouteMatcher(routeSpec.regex, routeSpec.matchFields)

    delete routeSpec.regex
    delete routeSpec.matchFields
  }
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

  var routeItemToRouteBuildSpec = function(routeItem, routeBuildSpec) {
    var routeBuildSpec = copyObject(routeItem, {
      excludeFields: ['handler']
    })

    routeBuildSpec.handlerName = routeItem.handler

    addUrlBuilderToRouteSpec(routeBuildSpec)
    compileDynamicRoute(routeBuildSpec)

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
    if(routeItem.handler) {
      var routeBuildSpec = copyObject(routeItem, {
        excludeFields: ['handler']
      })

      var handlerName = routeItem.handler

      return routeItemToRouteBuildSpec(routeItem)

    } else {
      var routeBuildSpec = copyObject(routeItem, {
        excludeFields: ['handlers']
      })

      var methodItems = routeItem.handlers

      var methodBuildSpecs = methodItems.map(function(methodItem) {
        var methodBuildSpec = copyObject(methodItem, {
          excludeFields: ['handler']
        })

        var handlerName = methodItem.handler

        return routeItemToRouteBuildSpec(routeBuildSpec, methodBuildSpec)
      })

      routeBuildSpec.handleableBuilders = methodBuildSpecs
      return routeBuildSpec
    }
  })

  return routeBuildSpecs
}

module.exports = {
  routeListComponentToRouteBuildSpecs: routeListComponentToRouteBuildSpecs
}