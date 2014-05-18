'use strict'

var fooHandleableBuilder = function(config, callback) {

}

var barHandleableBuilder = function(config, callback) {
  
}

var routeSpecs = [
  {
    routeType: 'static',
    path: '/foo',
    handlers: [
      {
        method: 'GET',
        handleable: fooGetHandleable
      },
      {
        method: 'POST',
        handleable: fooPostHandleable
      }
    ]
  },
  {
    routeType: 'param',
    path: '/bar/:name',
    handleable: barHandleable
  }
]

var routeBuildSpecs = [
  {
    routeType: 'static',
    path: '/foo',
    handleableBuilders: [
      {
        method: 'GET',
        handleableBuilder: fooGetHandleableBuilder
      },
      {
        method: 'POST',
        handleableBuilder: fooPostHandleableBuilder
      }
    ]
  },
  {
    routeType: 'param',
    path: '/bar/:name',
    handleableBuilder: barHandleableBuilder
  }
]

var routeListComponent = {
  name: 'test route list',
  type: 'route list',
  routeList: [
    {
      routeType: 'static',
      path: '/foo',
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
      path: '/bar/:name',
      handler: 'bar handler'
    }
  ],
  middlewares: [
    'foo middleware'
  ]
}