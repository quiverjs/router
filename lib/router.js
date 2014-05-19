'use strict'

var method = require('./method')
var builder = require('./builder')
var handler = require('./handler')
var routeList = require('./route-list')
var mergeObjects = require('quiver-merge').mergeObjects

module.exports = mergeObjects([
  method, builder, handler, routeList
])