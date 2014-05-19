'use strict'

var error = require('quiver-error').error

var createMethodRouterStreamHandler = function(methodIndex) {
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

var createMethodRouterHttpHandler = function(methodIndex) {
  var handler = function(requestHead, requestStreamable, callback) {
    var method = requestHead.method
    var handler = methodIndex[method]

    if(!handler) return callback(error(405,
      'method not allowed'))

    handler(requestHead, requestStreamable, callback)
  }

  return handler
}

var createMethodRoutedHandleable = function(methodSpecs) {
  var streamMethodIndex = { }
  var httpMethodIndex = { }

  methodSpecs.forEach(function(methodSpec) {
    var handleable = methodSpec.handleable

    if(handleable.toStreamHandler) {
      streamMethodIndex[handleable.method] = handleable.toStreamHandler()
    }

    if(handleable.toHttpHandler) {
      httpMethodIndex[handleable.method] = handleable.toHttpHandler()
    }
  })

  var streamHandler = createMethodRouterStreamHandler(streamMethodIndex)
  var httpHandler = createMethodRouterHttpHandler(httpMethodIndex)
}

module.exports = {
  createMethodRoutedHandleable: createMethodRoutedHandleable
}