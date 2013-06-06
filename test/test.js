
'use strict'

var should = require('should')
var router = require('../lib/router')
var async = require('quiver-async-tasks')
var streamConvert = require('quiver-stream-convert')
var streamChannel = require('quiver-stream-channel')

var createEmptyStreamable = streamChannel.createEmptyStreamable

describe('route matcher test', function() {
  it('regex matcher test', function() {
    var matcher = router.createRegexRouteMatcher(/^\/hello(\/\w+)$/, ['name'])

    var result1 = matcher('/dont-exist')
    should.not.exist(result1)

    var result2 = matcher('/hello/world')
    should.exist(result2)
    result2.name.should.equal('/world')
  })
})

describe('router tests', function() {
  it('static route test', function(callback) {
    var fooCalled = false
    var staticRoutes = {
      '/foo': function(args, streamable, callback) {
        fooCalled = true
        callback(null, streamConvert.textToStreamable('foo handler'))
      },
      '/bar': function(args, streamable, callback) {
        throw new Error('should never reached')
      }
    }

    var routeSpecs = { staticRoutes:  staticRoutes }
    router.createRouterHandler(routeSpecs, function(err, routeHandler) {
      should.not.exist(err)

      async.parallelArray([
        function(callback) {
          var args = { path: '/foo' }
          routeHandler(args, createEmptyStreamable(), function(err, resultStreamable) {
            should.not.exist(err)

            streamConvert.streamableToText(resultStreamable, function(err, result) {
              should.not.exist(err)
              result.should.equal('foo handler')
              callback()
            })
          })
        },
        function(callback) {
          var args = { path: '/blah'}
          routeHandler(args, createEmptyStreamable(), function(err, resultStreamable) {
            err.errorCode.should.equal(404)
            callback()
          })
        },
        function(callback) {
          routeHandler({ }, createEmptyStreamable(), function(err, resultStreamable) {
            err.errorCode.should.equal(400)
            callback()
          })
        }
      ], callback)
    })
  })

  it('dynamic route test', function(callback) {
    var staticRoutes = {
      '/foo': function(args, streamable, callback) {
        callback(null, streamConvert.textToStreamable('static foo handler'))
      },
      '/bar': function(args, streamable, callback) {
        throw new Error('should never called')
      }
    }

    var dynamicRoutes = [
      {
        matcher: router.createRegexRouteMatcher(/^\/hello(\/\w+)$/, ['path']),
        handler: function(args, streamable, callback) {
          args.path.should.equal('/world')
          callback(null, streamConvert.textToStreamable('hello handler'))
        }
      },
      {
        // override /foo handler
        matcher: router.createRegexRouteMatcher(/^\/foo$/),
        handler: function(args, streamable, callback) {
          throw new Error('should never called')
        }
      }
    ]

    var defaultHandler = function(args, streamable, callback) {
      args.path.should.equal('/dont-exist')
      callback(null, streamConvert.textToStreamable('default handler'))
    }

    var config = {
      staticRoutes: staticRoutes,
      dynamicRoutes: dynamicRoutes,
      defaultRoute: defaultHandler
    }

    router.createRouterHandler(config, function(err, routeHandler) {
      should.not.exist(err)

      async.parallelArray([
        function(callback) {
          var args = { path: '/hello/world' }
          routeHandler(args, createEmptyStreamable(), function(err, resultStreamable) {
            should.not.exist(err)

            streamConvert.streamableToText(resultStreamable, function(err, result) {
              should.not.exist(err)

              result.should.equal('hello handler')
              callback()
            })
          })
        },
        function(callback) {
          var args = { path: '/foo' }

          routeHandler(args, createEmptyStreamable(), function(err, resultStreamable) {
            should.not.exist(err)

            streamConvert.streamableToText(resultStreamable, function(err, result) {
              should.not.exist(err)

              result.should.equal('static foo handler')
              callback()
            })
          })
        },
        function(callback) {
          var args = { path: '/dont-exist' }

          routeHandler(args, createEmptyStreamable(), function(err, resultStreamable) {
            should.not.exist(err)

            streamConvert.streamableToText(resultStreamable, function(err, result) {
              should.not.exist(err)

              result.should.equal('default handler')
              callback()
            })
          })
        }
      ], callback)
    })
  })
})

describe('route handler factory test', function() {
  it('basic factory test', function(callback) {
    var routeSpecs = [
      {
        routeType: 'static',
        path: '/foo',
        handlerBuilder: function(config, callback) {
          var fooValue = config.fooConfig
          fooValue.should.equal('foo')

          // try to temper config
          config.barConfig = 'foo'

          var handler = function(args, streamable, callback) {
            callback(null, streamConvert.textToStreamable(fooValue))
          }

          callback(null, handler)
        }
      },
      {
        routeType: 'static',
        path: '/bar',
        handlerBuilder: function(config, callback) {
          var barValue = config.barConfig
          barValue.should.equal('bar')

          // try to temper config
          config.fooConfig = 'bar'

          var handler = function(args, streamable, callback) {
            callback(null, streamConvert.textToStreamable(barValue))
          }

          callback(null, handler)
        }
      },
      {
        routeType: 'regex',
        regex: /^\/hello(\/\w+)$/, 
        matchFields: ['path'],
        handlerBuilder: function(config, callback) {
          var handler = function(args, streamable, callback) {
            args.path.should.equal('/world')
            callback(null, streamConvert.textToStreamable('hello world'))
          }

          callback(null, handler)
        }
      },
      {
        routeType: 'default',
        handlerBuilder: function(config, callback) {
          var handler = function(args, streamable, callback) {
            callback(null, streamConvert.textToStreamable('default handler'))
          }

          callback(null, handler)
        }
      }
    ]

    var routeHandlerBuilder = router.createRouterHandlerBuilder(routeSpecs)
    var config = {
      fooConfig: 'foo',
      barConfig: 'bar'
    }
    routeHandlerBuilder(config, function(err, handler) {
      if(err) throw err

      async.parallelArray([
        function(callback) {
          var args = { path: '/foo' }
          handler(args, createEmptyStreamable(), function(err, resultStreamable) {
            if(err) throw err

            streamConvert.streamableToText(resultStreamable, function(err, result) {
              if(err) throw err

              result.should.equal('foo')
              callback()
            })
          })
        },
        function(callback) {
          var args = { path: '/bar' }
          handler(args, createEmptyStreamable(), function(err, resultStreamable) {
            if(err) throw err

            streamConvert.streamableToText(resultStreamable, function(err, result) {
              if(err) throw err

              result.should.equal('bar')
              callback()
            })
          })
        },
        function(callback) {
          var args = { path: '/hello/world' }
          handler(args, createEmptyStreamable(), function(err, resultStreamable) {
            if(err) throw err

            streamConvert.streamableToText(resultStreamable, function(err, result) {
              if(err) throw err

              result.should.equal('hello world')
              callback()
            })
          })
        },
        function(callback) {
          var args = { path: '/not-found' }
          handler(args, createEmptyStreamable(), function(err, resultStreamable) {
            if(err) throw err

            streamConvert.streamableToText(resultStreamable, function(err, result) {
              if(err) throw err

              result.should.equal('default handler')
              callback()
            })
          })
        },
      ], callback)
    })
  })
})