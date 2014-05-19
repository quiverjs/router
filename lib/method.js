'use strict'

var httpLib = require('./http')
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

var createMethodRouterHandleable = function(methodSpecs) {
  var streamMethodIndex = { }
  var httpMethodIndex = { }

  methodSpecs.forEach(function(methodSpec) {
    var handleable = methodSpec.handleable

    if(handleable.toStreamHandler) {
      var streamHandler = handleable.toStreamHandler()
      streamMethodIndex[methodSpec.method] = streamHandler

      if(!handleable.toHttpHandler) {
        httpMethodIndex[methodSpec.method] = httpLib.trivialStreamToHttpHandler(streamHandler)
      }
    }

    if(handleable.toHttpHandler) {
      httpMethodIndex[methodSpec.method] = handleable.toHttpHandler()
    }
  })

  var streamHandler = createMethodRouterStreamHandler(streamMethodIndex)
  var httpHandler = createMethodRouterHttpHandler(httpMethodIndex)

  var handleable = {
    toStreamHandler: function() {
      return streamHandler
    },
    toHttpHandler: function() {
      return httpHandler
    }
  }

  return handleable
}

module.exports = {
  createMethodRouterStreamHandler: createMethodRouterStreamHandler,
  createMethodRouterHttpHandler: createMethodRouterHttpHandler,
  createMethodRouterHandleable: createMethodRouterHandleable
}