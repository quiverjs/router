
var router = require('../lib/router')
var should = require('should')
var createEmptyReadStream = require('quiver-stream-channel').createEmptyReadStream
var streamConvert = require('quiver-stream-convert')

var async = require('async')

describe('route matcher test', function() {
  it('regex matcher test', function() {
    var matcher = router.createRegexMatcher(/^\/hello(\/\w+)$/, ['name'])

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

    var config = { staticRoutes:  staticRoutes }
    router.createRouterHandler(config, function(err, routeHandler) {
      should.not.exist(err)

      async.parallel([
        function(callback) {
          var args = { path: '/foo' }
          routeHandler(args, createEmptyReadStream(), function(err, resultStreamable) {
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
          routeHandler(args, createEmptyReadStream(), function(err, resultStreamable) {
            err.errorCode.should.equal(404)
            callback()
          })
        },
        function(callback) {
          routeHandler({ }, createEmptyReadStream(), function(err, resultStreamable) {
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
        matcher: router.createRegexMatcher(/^\/hello(\/\w+)$/, ['path']),
        handler: function(args, streamable, callback) {
          args.path.should.equal('/world')
          callback(null, streamConvert.textToStreamable('hello handler'))
        }
      },
      {
        // override /foo handler
        matcher: router.createRegexMatcher(/^\/foo$/),
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

      async.parallel([
        function(callback) {
          var args = { path: '/hello/world' }
          routeHandler(args, createEmptyReadStream(), function(err, resultStreamable) {
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

          routeHandler(args, createEmptyReadStream(), function(err, resultStreamable) {
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

          routeHandler(args, createEmptyReadStream(), function(err, resultStreamable) {
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