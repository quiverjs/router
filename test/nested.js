'use strict'

var async = require('async')
var should = require('should')
var copyObject = require('quiver-copy').copyObject
var streamChannel = require('quiver-stream-channel')
var streamConvert = require('quiver-stream-convert')

var routerLib = require('../lib/router')

var text = streamConvert.textToStreamable
var voidStream = streamChannel.createEmptyStreamable()

var eqText = function(streamable, value, callback) {
  streamConvert.streamableToText(streamable, function(err, text) {
    if(err) return callback(err)
    
    should.equal(text, value)
    callback()
  })
}

var testHandler = function(args, inputStreamable, callback) {
  should.equal(args.id, 'foo')
  callback(null, text('success'))
}

var testHandleable = {
  toStreamHandler: function() {
    return testHandler
  }
}

var testHandleableBuilder = function(config, callback) {
  var urlBuilder = config.urlBuilder
  should.exists(urlBuilder)

  var res = urlBuilder({ id: 'bar' })
  if(res.err) return callback(res.err)

  should.equal(res.value, '/outer/bar/inner')

  callback(null, testHandleable)
}

var innerRouteListComponent = {
  routeList: [
    {
      routeType: 'static',
      path: '/inner',
      handler: 'test handler'
    }
  ]
}

var outerRouteListComponent = {
  routeList: [
    {
      routeType: 'param',
      path: '/outer/:id/:subpath',
      handler: 'inner router handler'
    }
  ]
}

var innerRouteBuildSpecs = routerLib.routeListComponentToRouteBuildSpecs(
  innerRouteListComponent)

var outerRouteBuildSpecs = routerLib.routeListComponentToRouteBuildSpecs(
  outerRouteListComponent)

var innerHandleableBuilder = routerLib.createRouterHandleableBuilderFromRouteBuildSpecs(
  innerRouteBuildSpecs)

var outerHandleableBuilder = routerLib.createRouterHandleableBuilderFromRouteBuildSpecs(
  outerRouteBuildSpecs)

var testConfig = {
  quiverHandleableBuilders: {
    'test handler': testHandleableBuilder,
    'inner router handler': innerHandleableBuilder
  }
}

var testRouterStreamHandler = function(streamHandler, callback) {
  var args = {
    path: '/outer/foo/inner'
  }

  streamHandler(args, voidStream, callback)
}
var testRouterHttpHandler = function(httpHandler, callback) {
  var requestHead = {
    method: 'GET',
    url: '/outer/foo/inner'
  }

  httpHandler(requestHead, voidStream, callback)
}

describe('nested router test', function() {
  it('nested should work on both http and stream routers', function(callback) {
    outerHandleableBuilder(copyObject(testConfig), function(err, handleable) {
      if(err) return callback(err)
      
      var streamHandler = handleable.toStreamHandler()
      var httpHandler = handleable.toHttpHandler()

      async.parallel([
        function(callback) {
          testRouterStreamHandler(streamHandler, callback)
        },
        function(callback) {
          testRouterHttpHandler(httpHandler, callback)
        }
      ], callback)
    })
  })
})