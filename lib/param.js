'use strict'

var error = require('quiver-error').error
var regexLib = require('./regex')

var escapeRegExp = function(string){
  return string.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
}

var restPathRegex = /\/:subpath$/

var paramRegexString = '([^\\/]+)'

var invalidUrlRegex = /[^\w\$\-\_\.\+\!\*\'\(\)\,]/
var invalidSubpathRegex = /[^\w\$\-\_\.\+\!\*\'\(\)\,\/]/

var createParamRouteMatcher = function(paramPath) {
  var hasRestPath = restPathRegex.test(paramPath)

  if(hasRestPath) {
    paramPath = paramPath.replace(restPathRegex, '')
  }

  var parts = paramPath.split(/(:\w+)/)

  var regexString = '^'
  var matchFields = []

  parts.forEach(function(part) {
    if(part[0] == ':' && part.length > 1) {
      var field = part.slice(1)
      matchFields.push(field)

      regexString += paramRegexString

    } else {
      regexString += escapeRegExp(part)
    }
  })

  if(hasRestPath) {
    regexString += '(\\/.*)'
    matchFields.push('path')
  }

  regexString += '$'

  var regex = new RegExp(regexString)

  return regexLib.createRegexRouteMatcher(regex, matchFields)
}

var createParamUrlBuilder = function(paramPath) {
  var hasRestPath = restPathRegex.test(paramPath)

  if(hasRestPath) {
    paramPath = paramPath.replace(restPathRegex, '')
  }

  var parts = paramPath.split(/(:\w+)/)

  var urlBuilder = function(args) {
    var url = ''

    for(var i=0; i<parts.length; i++) {
      var part = parts[i]

      if(part[0] == ':' && part.length > 1) {
        var field = part.slice(1)
        var value = args[field]
        
        if(typeof(value) != 'string') {
          return { err: error(400, 
            'args value for subpath ' + field + ' is not of type string') }
        }

        if(invalidUrlRegex.test(value)) {
          return { err: error(400,
            'args value must be url escaped before hand') }
        }

        url += value

      } else {
        url += part
      }
    }

    if(hasRestPath) {
      var restPath = args.path || '/'

      if(invalidSubpathRegex.test(restPath)) {
        return { err: error(400,
          'args value must be url escaped before hand') }
      }

      if(url.slice(-1) == '/' && restPath[0] == '/') {
        url += restPath.slice(1)
      } else {
        url += restPath
      }
    }

    return { value: url }
  }

  return urlBuilder
}

module.exports = {
  createParamRouteMatcher: createParamRouteMatcher,
  createParamUrlBuilder: createParamUrlBuilder
}