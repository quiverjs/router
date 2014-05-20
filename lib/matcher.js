'use strict'

var pathtoRegexp = require('path-to-regexp')

var createParamRouteMatcher = function(paramPath) {
  var keyIndex = []

  var regex = pathtoRegexp(paramPath, keyIndex)

  var matcher = function(path) {
    var matches = regex.exec(path)
    if(!matches) return null

    var args = { }

    for(var i=1; i<matches.length; i++) {
      var key = keyIndex[i-1]
      args[key.name] = matches[i]
    }

    return args
  }

  return matcher
}

var createRegexRouteMatcher = function(regex, fields) {
  if(!fields) fields = [ ]

  var matcher = function(path) {
    var matches = path.match(regex)
    if(!matches) return null

    var args = { }

    for(var i=0; i<fields.length; i++) {
      var key = fields[i]
      var match = matches[i+1]

      args[key] = match
    }

    return args
  }

  return matcher
}

module.exports = {
  createParamRouteMatcher: createParamRouteMatcher,
  createRegexRouteMatcher: createRegexRouteMatcher
}