'use strict'

var copyObject = require('quiver-copy').copyObject
var mergeObjects = require('quiver-merge').mergeObjects
var middlewareLib = require('quiver-middleware')

var loaderLib = require('./loader')
var matcherLib = require('./matcher')
var builderLib = require('./builder')
var urlBuilderLib = require('./url-builder')

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

  var routeList = componentSpec.routeList

  var routeBuildSpecs = routeList.map(
  function(routeItem) {
    var routeBuildSpec = copyObject(routeItem, {
      excludeFields: ['handler', 'handlers']
    })

    var urlBuilder = urlBuilderLib.getUrlBuilderFromRouteSpec(routeItem)
    compileDynamicRoute(routeBuildSpec)

    if(routeItem.handler) {
      var handlerName = routeItem.handler
      routeBuildSpec.handlerName = handlerName

      routeBuildSpec.handleableBuilder = loaderLib.createRouteLoaderHandleableBuilder(
        handlerName, urlBuilder, routeListMiddleware)

      return routeBuildSpec

    } else {
      var methodItems = routeItem.handlers

      routeBuildSpec.handleableBuilders = methodItems.map(
      function(methodItem) {
        var methodBuildSpec = copyObject(methodItem, {
          excludeFields: ['handler']
        })

        var handlerName = methodItem.handler
        methodBuildSpec.handlerName = handlerName

        methodBuildSpec.handleableBuilder = loaderLib.createRouteLoaderHandleableBuilder(
          handlerName, urlBuilder, routeListMiddleware)

        return methodBuildSpec
      })

      return routeBuildSpec
    }
  })

  return routeBuildSpecs
}

module.exports = {
  routeListComponentToRouteBuildSpecs: routeListComponentToRouteBuildSpecs
}