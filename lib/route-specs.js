'use strict'

var copyObject = require('quiver-copy').copyObject

var routeBuildSpecsToRouteSpecs = function(config, routeBuildSpecs, callback) {
  if(!config.quiverHandleables) config.quiverHandleables = { }

  async.map(routeBuildSpecs, function(routeBuildSpec, callback) {
    var handlerName = routeBuildSpec.handlerName
    var handleableBuilder = routeBuildSpec.handleableBuilder

    handleableBuilder(copyObject(config), function(err, handleable) {
      if(err) return callback(err)
      
      config.quiverHandleables[handlerName] = handleable

      var routeSpec = copyObject(routeBuildSpec)

      routeSpec.handeable = handleable
      delete routeSpec.handleableBuilder
    })
  }, callback)
}

module.exports = {
  routeBuildSpecsToRouteSpecs: routeBuildSpecsToRouteSpecs
}