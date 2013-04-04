
var error = require('quiver-error').error

var defaultRouteHandler = function(args, streamable, callback) {
  callback(error(404, 'no route available for this path'))
}

var createRegexMatcher = function(regex, fields) {
  if(!fields) fields = [ ]

  return function(path) {
    var matches = path.match(regex)
    if(!matches) return null

    var args = { }
    for(var i=0; i<fields.length; i++) {
      args[fields[i]] = matches[i+1]
    }

    return args
  }
}

var createRouterHandler = function(config, callback) {
  var staticRoutes = config.staticRoutes || { }
  var dynamicRoutes = config.dynamicRoutes || [ ]
  var defaultRoute = config.defaultRoute || defaultRouteHandler

  var handler = function(args, inputStreamable, callback) {
    var path = args.path
    if(!path) return callback(error(400, 'must provide a valid path'))

    if(staticRoutes[path]) {
      return staticRoutes[path](args, inputStreamable, callback)
    }

    for(var i=0; i<dynamicRoutes.length; i++) {
      var route = dynamicRoutes[i]
      var matchedArgs = route.matcher(path)

      if(matchedArgs) {
        for(var key in matchedArgs) {
          args[key] = matchedArgs[key]
        }
        return dynamicRoutes[i].handler(args, inputStreamable, callback)
      }
    }

    defaultRoute(args, inputStreamable, callback)
  }

  callback(null, handler)
}

module.exports = {
  createRegexMatcher: createRegexMatcher,
  createRouterHandler: createRouterHandler
}