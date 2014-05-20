'use strict'

var error = require('quiver-error').error

var createValidIndex = function() {
  return {
    staticRoutes: { }
  }
}

var validateStaticRoute = function(routeSpec, validIndex) {
  var staticPath = routeSpec.path

  if(!staticPath || typeof(staticPath) != 'string') {
    return error(400, 'invalid static path')
  }

  if(validIndex.staticRoutes[staticPath]) {
    return error(409, 'conflicting static routes found for path ' + staticPath)
  }

  validIndex.staticRoutes[staticPath] = true

  return null
}

var validateDynamicRoute = function(routeSpec, validIndex) {
  var matcher = routeSpec.matcher

  if(!matcher || typeof(matcher) != 'function') {
    return error(400, 'invalid dynamic route matcher')
  }

  return null
}

var validateDefaultRoute = function(routeSpec, validIndex) {
  if(validIndex.defaultRoute) {
    return error(409, 'multiple default routes not allowed in route specs')
  }

  validIndex.defaultRoute = true

  return null
}

var validateRegexRoute = function(routeSpec, validIndex) {
  var regex = routeSpec.regex
  var matchFields = routeSpec.matchFields

  if(!regex || !(regex instanceof RegExp)) {
    return error(400, 'invalid regex')
  }

  if(!matchFields || !Array.isArray(matchFields)) {
    return error(400, 'invalid regex match fields')
  }

  return null
}

var validateParamRoute = function(routeSpec, validIndex) {
  var paramPath = routeSpec.path

  if(!paramPath || typeof(paramPath) != 'string') {
    return error(400, 'invalid static path')
  }

  return null
}

var routeSpecValidators = {
  'static': validateStaticRoute,
  'dynamic': validateDynamicRoute,
  'default': validateDefaultRoute
}

var routeItemValidators = {
  'static': validateStaticRoute,
  'dynamic': validateDynamicRoute,
  'regex': validateRegexRoute,
  'param': validateParamRoute,
  'default': validateDefaultRoute
}

var validateRouteType = function(routeSpec, validIndex, validatorTable) {
  var routeType = routeSpec.routeType

  var validator = validatorTable[routeType]

  if(!validator) {
    return error(400, 'invalid route type')
  }

  return validator(routeSpec, validIndex)
}

var validateHandler = function(handler) {
  if(typeof(handler) != 'string') {
    return error(400, 'handler field must be of type string')
  }

  return null
}

var validateHandleable = function(handleable) {
  if(typeof(handleable) != 'object') {
    return error(400, 'invalid handleable field')
  }

  return null
}

var validableHandleableBuilder = function(handleableBuilder) {
  if(typeof(handleableBuilder) != 'function') {
    return error(400, 'handleable builder field must be function')
  }

  return null
}

var handlerField = {
  handler: 'handler',
  handlers: 'handlers',
  validateHandler: validateHandler
}

var handleableField = {
  handler: 'handleable',
  handlers: 'handleables',
  validateHandler: validateHandleable
}

var handleableBuilderField = {
  handler: 'handleableBuilder',
  handlers: 'handleableBuilders',
  validateHandler: validableHandleableBuilder
}

var validateMethodSpec = function(methodSpec, field) {
  if(!methodSpec) {
    return error(400, 'invalide method spec')
  }

  if(typeof(methodSpec.method) != 'string') {
    return error(400, 'no method specified in method spec')
  }

  var handler = methodSpec[field.handler]

  return field.validateHandler(handler)
}

var validateMethodSpecs = function(methodSpecs, field) {
  for(var i=0; i<methodSpecs.length; i++) {
    var err = validateMethodSpec(methodSpecs[i], field)

    if(err) return err
  }

  return null
}

var validateRouteSpec = function(routeSpec, field) {
  if(!routeSpec) {
    return error(400, 'route spec not defined')
  }

  if(routeSpec.urlBuilder && typeof(routeSpec.urlBuilder) != 'function') {
    return error(400, 'urlBuilder field must contain function')
  }

  var handler = routeSpec[field.handler]
  var handlers = routeSpec[field.handlers]

  if(handler && handlers) {
    return error(400, 'route spec contain both single/multi handler fields')
  }

  if(!handler && !handlers) {
    return error(400, 'handler not provided for route spec')
  }

  if(handler) {
    return field.validateHandler(handler)

  } else if(handlers) {
    return validateMethodSpecs(handlers, field)

  }
}

var doValidateRouteSpecs = function(routeSpecs, field, routeTypeValidators) {
  if(!Array.isArray(routeSpecs)) {
    return error(400, 'route specs is not an array')
  }

  var validIndex = createValidIndex()

  for(var i=0; i<routeSpecs.length; ++i) {
    var routeSpec = routeSpecs[i]

    var err = validateRouteType(routeSpec, validIndex, routeTypeValidators)
    if(err) return err

    err = validateRouteSpec(routeSpec, field)
    if(err) return err
  }

  return null
}

var validateRouteSpecs = function(routeSpecs) {
  return doValidateRouteSpecs(routeSpecs, handleableField, routeSpecValidators)
}

var validateRouteBuildSpecs = function(routeBuildSpecs) {
  return doValidateRouteSpecs(routeBuildSpecs, handleableBuilderField, routeSpecValidators)
}

var validateRouteList = function(routeList) {
  return doValidateRouteSpecs(routeList, handlerField, routeItemValidators)
}

module.exports = {
  validateRouteSpecs: validateRouteSpecs,
  validateRouteBuildSpecs: validateRouteBuildSpecs,
  validateRouteList: validateRouteList
}