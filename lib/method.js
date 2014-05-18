'use strict'

var error = require('quiver-error').error

var createMethodRoutedStreamHandler = function(methodIndex) {
  var handler = function(args, inputStreamable, callback) {
    var requestHead = args.requestHead

    if(!requestHead) return callback(error(400,
      'missing requestHead in args'))

    var method = requestHead.method
    var handler = methodIndex[method]

    if(!handler) return callback(error(405,
      'method not allowed'))

    handler(args, inputStreamable, callback)
  }

  return handler
}

var createMethodRoutedHttpHandler = function(methodIndex) {
  var handler = function(requestHead, requestStreamable, callback) {
    var method = requestHead.method
    var handler = methodIndex[method]

    if(!handler) return callback(error(405,
      'method not allowed'))

    handler(requestHead, requestStreamable, callback)
  }

  return handler
}

var addMethodSpecToIndex = function()

var createMethodRoutedHandleable = function(methodSpecs) {
  var streamMethodIndex = { }
  var httpMethodIndex = { }

  var streamRouteIndex = createMethodRoutedStreamHandler
}