'use strict'

var urlLib = require('url')

var getPathFromRequestHead = function(requestHead) {
  return urlLib.parse(requestHead.url, true).pathname
}

/*
 * Stub for prototyping the router lib. This function should belong to
 * a separate quiver-http library.
 */
var trivialStreamToHttpHandler = function(streamHandler) {
  var httpHandler = function(requestHead, requestStreamable, callback) {
    var path = getPathFromRequestHead(requestHead)

    var args = {
      path: path,
      requestHead: requestHead 
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
  getPathFromRequestHead: getPathFromRequestHead
  trivialStreamToHttpHandler: trivialStreamToHttpHandler
}