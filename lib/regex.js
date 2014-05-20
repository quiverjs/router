'use strict'

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
  createRegexRouteMatcher: createRegexRouteMatcher
}