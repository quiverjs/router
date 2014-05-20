'use strict'

var method = require('./method')
var builder = require('./builder')
var handler = require('./handler')
var matcher = require('./matcher')
var routeList = require('./route-list')
var urlBuilder = require('./url-builder')
var mergeObjects = require('quiver-merge').mergeObjects

module.exports = mergeObjects([
  method, builder, handler, matcher, routeList, urlBuilder
])