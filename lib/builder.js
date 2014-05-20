'use strict'

var error = require('quiver-error').error
var handlerLib = require('./handler')
var validateLib = require('./validate')
var routeSpecsLib = require('./route-specs')

var createRouterHandleableFromRouteBuildSpecs = function(config, routeBuildSpecs, callback) {
  routeSpecsLib.routeBuildSpecsToRouteSpecs(config, routeBuildSpecs, 
  function(err, routeSpecs) {
    if(err) return callback(err)

    var handleable = handlerLib.createRouterHandleableFromRouteSpecs(routeSpecs)

    callback(null, handleable)
  })
}

var createRouterHandleableFromRouteListNames = function(config, routeListNames, callback) {
  var routeBuildSpecs = []
  var routeBuildSpecsTable = config.quiverRouteBuildSpecs || { }

  for(var i=0; i<routeListNames.length; i++) {
    var routeListName = routeListNames[i]

    var currentRouteBuildSpecs = routeBuildSpecsTable[routeListName]
    if(!currentRouteBuildSpecs) return callback(error(
      400, 'route build specs not found: ' + routeListName))

    routeBuildSpecs.push.apply(routeBuildSpecs, currentRouteBuildSpecs)
  }

  var err = validateLib.validateRouteBuildSpecs(routeBuildSpecs)
  if(err) return callback(err)
  
  createRouterHandleableFromRouteBuildSpecs(routeBuildSpecs, callback)
}

var createRouterHandleableBuilderFromRouteListNames = function(routeListNames) {
  var handleableBuilder = function(config, callback) {
    createRouterHandleableFromRouteListNames(config, routeListNames, callback)
  }

  return handleableBuilder
}

module.exports = {
  createRouterHandleableFromRouteBuildSpecs: createRouterHandleableFromRouteBuildSpecs,
  createRouterHandleableFromRouteListNames: createRouterHandleableFromRouteListNames,
  createRouterHandleableBuilderFromRouteListNames: createRouterHandleableBuilderFromRouteListNames
}