'use strict'

var pathLib = require('path')
var error = require('quiver-error').error
var copyObject = require('quiver-copy').copyObject
var paramLib = require('./param')

var createStaticUrlBuilder = function(path) {
  var urlBuilder = function(args) {
    return { value: path }
  }

  return urlBuilder
}

var combineUrlBuilders = function(builder1, builder2) {
  var combinedUrlBuilder = function(args) {
    args = copyObject(args)

    var res2 = builder2(args)
    if(res2.err) return { err: res2.err }

    args.path = res2.value

    return builder1(args)
  }

  return combinedUrlBuilder
}

var getUrlBuilderFromRouteSpec = function(routeSpec) {
  if(routeSpec.urlBuilder) return routeSpec.urlBuilder

  var routeType = routeSpec.routeType

  if(routeType == 'static') {
    return createStaticUrlBuilder(routeSpec.path)
  }

  if(routeType == 'param') {
    return paramLib.createParamUrlBuilder(routeSpec.path)
  }

  return null
}

module.exports = {
  createStaticUrlBuilder: createStaticUrlBuilder,
  combineUrlBuilders: combineUrlBuilders,
  getUrlBuilderFromRouteSpec: getUrlBuilderFromRouteSpec
}