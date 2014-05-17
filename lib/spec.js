'use strict'

var copyObject = require('quiver-copy').copyObject
var middlewareLib = require('quiver-middleware')
var builderLib = require('./builder')
var urlBuilderLib = require('./url-builder')

var routeItemToRouteSpec = function(routeItem) {
  var routeSpec = copyObject(routeItem)

  routeSpec.handlerName = routeItem.handler

  urlBuilderLib.addUrlBuilderToRouteSpec(routeSpec)
  builderLib.addHandleableBuilderToRouteSpec(routeSpec)

  return routeSpec
}

var routeListComponentToRouteSpecs = function(componentSpec) {
  var routeList = copyObject(componentSpec.routeList)

  if(componentSpec.middlewares) {
    var middlewares = componentSpec.middlewares

    var loaderMiddlewares = middlewares.map(
      middlewareLib.createMiddlewareFromMiddlewareSpec)

    var middleware = middlewareLib.safeCombineMiddlewares(loaderMiddlewares)

    routeList.forEach(function(routeItem) {
      routeItem.middleware = middleware
    })
  }

  return routeList.map(routeItemToRouteSpec)
}

module.exports = {
  routeItemToRouteSpec: routeItemToRouteSpec,
  routeListComponentToRouteSpecs: routeListComponentToRouteSpecs
}