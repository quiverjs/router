'use strict'

var util = require('util')
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

var fooGetStreamHandler = function(args, inputStreamable, callback) {
  callback(null, text('foo get'))
}

var fooPostHttpHandler = function(requestHead, requestStreamable, callback) {
  should.equal(requestHead.host, 'example.com')

  var responseHead = {
    statusCode: '202'
  }

  callback(null, responseHead, text('foo post'))
}

var barStreamHandler = function(args, inputStreamable, callback) {
  should.equal(args.name, 'baz')

  callback(null, text('bar handler'))
}

var fooGetHandleable = {
  toStreamHandler: function() {
    return fooGetStreamHandler
  }
}

var fooPostHandleable = {
  toHttpHandler: function() {
    return fooPostHttpHandler
  }
}

var fooHandleable = routerLib.createMethodRouterHandleable(fooMethodSpecs)

var barHandleable = {
  toStreamHandler: function() {
    return barStreamHandler
  }
}

var fooGetHandleableBuilder = function(config, callback) {
  should.equal(config.middlewareLoaded, true)

  callback(null, fooGetHandleable)
}

var fooPostHandleableBuilder = function(config, callback) {
  should.exists(config.quiverHandleables['foo get handler'])

  callback(null, fooPostHandleable)
}

var barHandleableBuilder = function(config, callback) {
  should.exists(config.quiverHandleables['foo post handler'])

  callback(null, barHandleable)
}

var routeMiddleware = function(config, handlerBuilder, callback) {
  config.middlewareLoaded = true

  handlerBuilder(config, callback)
}

var fooPath = '/foo'
var barPath = '/bar/:name'

var fooUrlBuilder = routerLib.createStaticUrlBuilder(fooPath)
var barUrlBuilder = routerLib.createParamUrlBuilder(barPath)

var barMatcher = routerLib.createParameterizedRouteMatcher(barPath)

var testConfig = {
  quiverHandleableBuilders: {
    'foo get handler': fooGetHandleableBuilder,
    'foo post handler': fooPostHandleableBuilder,
    'bar handler': barHandleableBuilder
  },
  quiverMiddlewares: {
    'route middleware': routeMiddleware
  },
  middlewareLoaded: true
}

var fooMethodSpecs = [
  {
    method: 'GET',
    handleable: fooGetHandleable
  },
  {
    method: 'POST',
    handleable: fooPostHandleable
  }
]

var routeSpecs = [
  {
    routeType: 'static',
    path: fooPath,
    handleable: fooHandleable
  },
  {
    routeType: 'param',
    path: barPath,
    handleable: barHandleable
  }
]

var routeBuildSpecs = [
  {
    routeType: 'static',
    path: fooPath,
    urlBuilder: fooUrlBuilder,
    handleableBuilders: [
      {
        handlerName: 'foo get handler',
        method: 'GET',
        handleableBuilder: fooGetHandleableBuilder
      },
      {
        handlerName: 'foo post handler',
        method: 'POST',
        handleableBuilder: fooPostHandleableBuilder
      }
    ]
  },
  {
    routeType: 'dynamic',
    matcher: barMatcher,
    handlerName: 'bar handler',
    handleableBuilder: barHandleableBuilder
  }
]

var routeListComponent = {
  name: 'test route list',
  type: 'route list',
  routeList: [
    {
      routeType: 'static',
      path: fooPath,
      handlers: [
        {
          method: 'GET',
          handler: 'foo get handler'
        },
        {
          method: 'POST',
          handler: 'foo post handler'
        }
      ]
    },
    {
      routeType: 'param',
      path: barPath,
      handler: 'bar handler'
    }
  ],
  
  middlewares: [
    'route middleware'
  ]

}

var testFooGetStream = function(streamHandler, callback) {
  var requestHead = {
    url: '/foo',
    method: 'GET'
  }

  var args = {
    requestHead: requestHead,
    path: '/foo'
  }

  streamHandler(args, voidStream, function(err, resultStreamable) {
    if(err) return callback(err)
    
    eqText(resultStreamable, 'foo get', callback)
  })
}

var testFooPostStream = function(streamHandler, callback) {
  var requestHead = {
    url: '/foo',
    method: 'POST'
  }

  var args = {
    requestHead: requestHead,
    path: '/foo'
  }

  streamHandler(args, voidStream, function(err, resultStreamable) {
    should.exists(err)
    should.equal(err.errorCode, 405)

    callback()
  })
}

var testBarStream = function(streamHandler, callback) {
  var args = {
    path: '/bar/baz'
  }

  streamHandler(args, voidStream, function(err, resultStreamable) {
    if(err) return callback(err)
    
    eqText(resultStreamable, 'bar handler', callback)
  })
}

var testFooGetHttp = function(streamHandler, callback) {
  var requestHead = {
    url: '/foo',
    method: 'GET'
  }

  streamHandler(requestHead, voidStream, function(err, responseHead, responseStreamable) {
    if(err) return callback(err)
    
    eqText(responseStreamable, 'foo get', callback)
  })
}

var testFooPostHttp = function(httpHandler, callback) {
  var requestHead = {
    url: '/foo',
    method: 'POST',
    host: 'example.com'
  }

  httpHandler(requestHead, voidStream, function(err, responseHead, responseStreamable) {
    if(err) return callback(err)

    should.equal(responseHead.statusCode, 202)
    
    eqText(responseStreamable, 'foo post', callback)
  })
}

var testHandler = function(handler, testCases, callback) {
  async.each(testCases, function(testCase, callback) {
    testCase(handler, callback)
  }, callback)
}

var testRouterStreamHandler = function(handler, callback) {
  testHandler(handler, [
    testFooGetStream,
    testFooPostStream,
    testBarStream
  ], callback)
}

var testRouterHttpHandler = function(handler, callback) {
  testHandler(handler, [
    testFooGetHttp,
    testFooPostHttp,
  ], callback)
}

var testRouterHandleable = function(handleable, callback) {
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
}

var testRouteBuildSpecs = function(routeBuildSpecs, config, callback) {
  routerLib.createRouterHandleableFromRouteBuildSpecs(
    config, routeBuildSpecs,
    function(err, handleable) {
      if(err) return callback(err)
      
      testRouterHandleable(handleable, callback)
    })
}

describe('router test 1', function() {
  it('route specs test', function(callback) {
    var routerHandleable = routerLib.createRouterHandleableFromRouteSpecs(routeSpecs)

    testRouterHandleable(routerHandleable, callback)
  })

  it('route build specs test', function(callback) {
    testRouteBuildSpecs(routeBuildSpecs, copyObject(testConfig), callback)
  })

  it.only('route list test', function(callback) {
    var routeBuildSpecs = routerLib.routeListComponentToRouteBuildSpecs(routeListComponent)

    var config = copyObject(testConfig)
    config.middlewareLoaded = false

    testRouteBuildSpecs(routeBuildSpecs, config, callback)
  })
})
