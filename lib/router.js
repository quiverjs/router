'use strict'

var param = require('./param')
var regex = require('./regex')
var method = require('./method')
var loader = require('./loader')
var builder = require('./builder')
var handler = require('./handler')
var validate = require('./validate')
var routeList = require('./route-list')
var urlBuilder = require('./url-builder')
var mergeObjects = require('quiver-merge').mergeObjects

module.exports = mergeObjects([
  param, regex, method, loader, builder, handler, validate, routeList, urlBuilder
])