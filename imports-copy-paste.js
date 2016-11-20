/* eslint-disable */

// ----- Large parts -----
import Application from 'ember-application'

import Component from 'ember-component'
import Checkbox from 'ember-components/checkbox'
import TextArea from 'ember-components/text-area'
import TextField from 'ember-components/text-field'

import Controller from 'ember-controller'
import controller from 'ember-controller/inject'
import ArrayProxy from 'ember-controller/proxy'
import SortableMixin from 'ember-controllers/sortable'

import Enumerable from 'ember-enumerable'

import Helper from 'ember-helper'
import {helper} from 'ember-helper'

// ----- Getters, setters -----
import get from 'ember-metal/get'
import {getProperties} from 'ember-metal/get'
import set from 'ember-metal/set'
import {setProperties, trySet} from 'ember-metal/set'


// ----- Data types -----
import Array from 'ember-array'
import MutableArray from 'ember-array/mutable'
import {A, isEmberArray} from 'ember-array/utils'

import {default as EObject} from 'ember-object'
const  O = EObject.create.bind(EObject)

import Map from 'ember-map'
import {withDefault as MapWithDefault} from 'ember-map'


// ----- Events, observers -----
import Evented from  'ember-evented'
import on from  'ember-evented/on'
import observer from 'ember-metal/observer'
import {addListener, removeListener} from 'ember-metal/events'
import {addObserver, removeObserver} from 'ember-metal/observer'


// ----- Debugging-----
import {log, inspect, run, warn} from 'ember-debug'
import DataAdapter from 'ember-debug/data-adapter'
import {aliasMethod, assert, cacheFor, copy, guidFor} from  'ember-metal/utils'


// ----- Runloop -----
import run, {begin, bind, cancel, debounce, end, join, later, next, once, schedule, scheduleOnce, throttle} from 'ember-runloop'


import service from 'ember-service/inject'


// ----- Utils -----
import {camelize, capitalize, classify, dasherize, decamelize, fmt, htmlSafe, loc, underscore, w} from 'ember-string'
import {isBlank, isEmpty, isNone, isPresent, tryInvoke, typeOf} from 'ember-utils'


// ----- CPs -----
import computed, {alias, and, bool, collect, deprecatingAlias, empty, equal, filter, filterBy, filterProperty,
  gt, gte, intersect, lt, lte, map, mapBy, mapProperty, match, max, min, none, not, notEmpty, oneWay,
  or, readOnly, reads, setDiff, sort, sum, union, uniq,} from 'ember-computed'


// ----- Third-party -----
import _ from 'npm:lodash'
import $ from 'jquery'
import RSVP from 'rsvp'
import {task} from 'ember-concurrency'
