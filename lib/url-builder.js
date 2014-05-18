'use strict'

var pathLib = require('path')

var pathToUrlBuilder = function(path) {
  // split the subpaths based on '/', ignoring front and trailing slashes
  var subpaths = path.replace(/^\//, '').replace(/\/$/, '').split('/')

  var dynamicSubpaths = []

  for(var i=0; i<subpaths.length; i++) {
    if(subpaths[i][0] == ':') dynamicSubpaths[i] = true
  }

  var urlBuilder = function(args) {
    var resultUrl = ''

    for(var i=0; i<subpaths.length; i++) {
      resultUrl += '/'

      var subpath = subpaths[i]
      if(dynamicSubpaths[i]) {
        var pathValue = args[subpath]

        if(typeof(pathValue) != 'string') return { err: error(
          400, 'args value for subpath ' + subpath + ' is not of type string') }

        resultUrl += pathValue
      } else {
        resultUrl += subpath
      }
    }

    return { value: resultUrl }
  }

  return urlBuilder
}

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

module.exports = {
  pathToUrlBuilder: pathToUrlBuilder,
  createStaticUrlBuilder: createStaticUrlBuilder,
  addUrlBuilderToRouteSpec: addUrlBuilderToRouteSpec,
  combineUrlBuilders: combineUrlBuilders
}