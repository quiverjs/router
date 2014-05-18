'use strict'

var handlerLib = require('./handler')
var validateLib = require('./validate')
var routeSpecsLib = require('./route-specs')

var createRouterHandleableBuilderFromRouteListNames = function(routeListNames) {
  var handleableBuilder = function(config, callback) {
    var routeBuildSpecs = []
    var routeBuildSpecsTable = config.quiverRouteBuildSpecs || { }

    for(var i=0; i<routeListNames.length; i++) {
      var routeListName = routeListNames[i]

      var currentRouteBuildSpecs = routeBuildSpecsTable[routeListName]
      if(!currentRouteBuildSpecs) return callback(error(
        400, 'route build specs not found: ' + routeListName))

      routeBuildSpecs = routeBuildSpecs.concat(currentRouteBuildSpecs)
    }

    var err = validateLib.validateRouteBuildSpecs(routeBuildSpecs)
    if(err) return callback(err)
    
    routeSpecsLib.routeBuildSpecsToRouteSpecs(config, routeBuildSpecs, 
    function(err, routeSpecs) {
      if(err) return callback(err)

      var handleable = handlerLib.createRouterHandleableFromRouteSpecs(routeSpecs)

      callback(null, handleable)
    })
  }

  return handleableBuilder
}

module.exports = {
  createRouterHandleableBuilderFromRouteListNames: createRouterHandleableBuilderFromRouteListNames
}