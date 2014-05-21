'use strict'

var urlLib = require('url')
var mergeObjects = require('quiver-merge').mergeObjects

/*
 * Stub for prototyping the router lib. This function should belong to
 * a separate quiver-http library.
 */

var getPathFromRequestHead = function(requestHead) {
  if(requestHead.args && requestHead.args.path) {
    return requestHead.args.path
  }

  return urlLib.parse(requestHead.url, true).pathname
}

var trivialStreamToHttpHandler = function(streamHandler) {
  var httpHandler = function(requestHead, requestStreamable, callback) {
    var path = getPathFromRequestHead(requestHead)

    var args = {
      path: path,
      requestHead: requestHead 
    }

    if(requestHead.args) {
      args = mergeObjects([requestHead.args, args])
    }

    streamHandler(args, requestStreamable, function(err, resultStreamable) {
      if(err) return callback(err)
      
      var responseHead = {
        statusCode: 200,
        headers: { }
      }

      callback(null, responseHead, resultStreamable)
    })
  }

  return httpHandler
}

module.exports = {
  getPathFromRequestHead: getPathFromRequestHead,
  trivialStreamToHttpHandler: trivialStreamToHttpHandler
}