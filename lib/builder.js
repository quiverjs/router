'use strict'

var async = require('async')
var copyObject = require('quiver-copy').copyObject
var configLib = require('quiver-config')
var middlewareLib = require('quiver-middleware')
var urlBuilderLib = require('./url-builder')

var createRouterHandleableBuilder = function(routeSpecs, routerBuilder) {
  var handleableBuilder = function(config, callback) {
    if(!config.inputHandleables) config.inputHandleables = { }

    async.map(routeSpecs, function(routeSpec, callback) {
      var handlerName = routeSpec.handlerName
      var handleableBuilder = routeSpec.handleableBuilder

      handleableBuilder(copyObject(config), function(err, handleable) {
        if(err) return callback(err)
        
        config.inputHandleables[handlerName] = handleable

        var newRouteSpec = copyObject(routeSpec)
        newRouteSpec.handeable = handleable
      })
    }, function(err, newRouteSpecs) {
      if(err) return callback(err)
      
      var handleable = routerBuilder(newRouteSpecs)
      callback(null, handleable)
    })
  }

  return handlerBuilder
}

var addHandleableBuilderToRouteSpec = function(routeSpec) {
  var handlerName = routeSpec.handlerName
  var routeType = routeSpec.routeType
  var urlBuilder = routeSpec.urlBuilder

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

  if(routeSpec.middleware) {
    handleableBuilder = middlewareLib.createMiddlewareManagedHandlerBuilder(
      middleware, handleableBuilder)
  }

  routeSpec.handleableBuilder = handleableBuilder
}

module.exports = {
  createRouterHandleableBuilder: createRouterHandleableBuilder,
  addHandleableBuilderToRouteSpec: addHandleableBuilderToRouteSpec
}