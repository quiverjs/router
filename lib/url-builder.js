'use strict'

var pathLib = require('path')
var paramLib = require('./param')

var createStaticUrlBuilder = function(path) {
  var urlBuilder = function(args) {
    return { value: path }
  }

  return urlBuilder
}

var combineUrlBuilders = function(builder1, builder2) {
  var combinedUrlBuilder = function(args) {
    var res1 = builder1(args)
    if(res1.err) return { err: res1.err }
    var path1 = res1.value

    var res2 = builder2(args)
    if(res2.err) return { err: res2.err }
    var path2 = res2.value

    var combinedPath = pathLib.join(path1, path2)
    return { value: combinedPath }
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