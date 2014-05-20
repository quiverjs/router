'use strict'

var configLib = require('quiver-config')
var middlewareLib = require('quiver-middleware')

var urlBuilderLib = require('./url-builder')

var createRouteLoaderHandleableBuilder = function(handlerName, urlBuilder, middleware) {
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

  if(middleware) {
    handleableBuilder = middlewareLib.createMiddlewareManagedHandlerBuilder(
      middleware, handleableBuilder)
  }

  return handleableBuilder
}

module.exports = {
  createRouteLoaderHandleableBuilder: createRouteLoaderHandleableBuilder
}