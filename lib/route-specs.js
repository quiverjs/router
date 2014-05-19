'use strict'

var copyObject = require('quiver-copy').copyObject

var routeBuildSpecToRouteSpec = function(config, routeBuildSpec, callback) {
  var handlerName = routeBuildSpec.handlerName
  var handleableBuilder = routeBuildSpec.handleableBuilder

  handleableBuilder(copyObject(config), function(err, handleable) {
    if(err) return callback(err)
    
    config.quiverHandleables[handlerName] = handleable

    var routeSpec = copyObject(routeBuildSpec, {
      excludeFields: ['handleableBuilder']
    })

    routeSpec.handeable = handleable

    callback(null, routeSpec)
  })
}

var routeBuildSpecsToRouteSpecs = function(config, routeBuildSpecs, callback) {
  if(!config.quiverHandleables) config.quiverHandleables = { }

  async.map(routeBuildSpecs, function(routeBuildSpec, callback) {
    if(routeBuildSpec.handleableBuilder) return routeBuildSpecToRouteSpec(
      config, routeBuildSpec, callback)

    var routeSpec = copyObject(routeBuildSpec, {
      excludeFields: ['handleableBuilders']
    })

    var methodBuildSpecs = routeBuildSpec.handleableBuilders

    async.map(methodBuildSpecs, function(methodBuildSpec, callback) {
      routeBuildSpecToRouteSpec(config, methodBuildSpec, callback)
    }, function(err, methodSpecs) {
      if(err) return callback(err)
      
      routeSpec.handleables = methodSpecs
      callback(null, routeSpec)
    })
  }, callback)
}

module.exports = {
  routeBuildSpecsToRouteSpecs: routeBuildSpecsToRouteSpecs
}