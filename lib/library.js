(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("superagent"));
	else if(typeof define === 'function' && define.amd)
		define(["superagent"], factory);
	else if(typeof exports === 'object')
		exports["library"] = factory(require("superagent"));
	else
		root["library"] = factory(root["superagent"]);
})(this, function(__WEBPACK_EXTERNAL_MODULE_1__) {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	
	Object.defineProperty(exports, "__esModule", {
	    value: true
	});
	
	var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };
	
	exports.default = function (customConfig) {
	    config = _extends({}, config, customConfig);
	    return superagentMiddleware;
	};
	
	var _superagent = __webpack_require__(1);
	
	var _superagent2 = _interopRequireDefault(_superagent);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	var config = {
	    base: "",
	    defaultHeaders: {
	        "Content-Type": "application/json"
	    },
	    hooks: {}
	};
	
	function goTo(action, store, next, payload, meta) {
	
	    if (typeof action !== "function") {
	        /* eslint-disable no-console */
	        console.error("superagentMiddleware error : onStart, onSuccess, onError, onComplete must be functions");
	        /* eslint-enable no-console */
	        return;
	    }
	
	    var res = action(payload, meta, store.dispatch, store.getState);
	    res && next(res);
	}
	
	function responseHandler(response) {
	
	    if (!response) {
	        return { error: true, meta: { requestFailed: true } };
	    }
	
	    var res = {
	        error: true,
	        payload: response.body,
	        meta: {
	            httpCode: response.status
	        }
	    };
	    if (response.status <= 300) {
	        res.error = false;
	    }
	
	    return res;
	}
	
	var superagentMiddleware = function superagentMiddleware(store) {
	    return function (next) {
	        return function (action) {
	
	            if (!action.request) {
	                return next(action);
	            }
	
	            // Cancelled status
	            var cancelled = false;
	
	            // Requests configuration
	            var requestActions = action.request instanceof Array ? action.request : [action.request];
	            var requests = requestActions.map(function (requestAction) {
	                var request = {
	                    base: requestAction.base || config.base,
	                    url: requestAction.url,
	                    method: requestAction.method || "GET",
	                    headers: _extends({}, config.defaultHeaders, requestAction.headers || {}),
	                    params: _extends({}, config.defaultParams, requestAction.params || {}),
	                    body: requestAction.body
	                };
	
	                if (config.hooks.onRequest) {
	                    request = config.hooks.onRequest(store, action, request) || request;
	                }
	
	                return request;
	            });
	
	            // Requests execution
	            action.onStart && goTo(action.onStart, store, next);
	            var promiseList = [];
	            requests.map(function (request) {
	                promiseList.push(new Promise(function (resolve) {
	                    var superagentRequest = (0, _superagent2.default)(request.method, request.base + request.url);
	                    request.params && superagentRequest.query(request.params);
	                    request.body && superagentRequest.send(request.body);
	                    superagentRequest.end(function (err, response) {
	                        resolve(response);
	                    });
	                }));
	            });
	
	            // Define cancel in action
	            action.cancel = function () {
	                cancelled = true;
	            };
	
	            // Handling responses
	            Promise.all(promiseList).then(function (responses) {
	
	                if (cancelled) {
	                    return;
	                }
	
	                var interrupted = false;
	                var hadError = false;
	                var finalPayload = {};
	                var finalMeta = {};
	                responses.map(function (response, index) {
	                    var test = responseHandler(response);
	
	                    if (test.meta.requestFailed && config.hooks.onFailure && config.hooks.onFailure(store, action, requestActions[index], response) === false || test.error && config.hooks.onError && config.hooks.onError(store, action, requestActions[index], response) === false) {
	                        interrupted = true;
	                    }
	                    if (test.error === true) {
	                        hadError = true;
	                    }
	
	                    if (!(action.request instanceof Array)) {
	                        finalPayload = test.payload, finalMeta = test.meta;
	                    } else {
	                        var name = requestActions[index].name || "request_" + index;
	                        finalPayload[name] = test.payload;
	                        finalMeta[name] = test.meta;
	                    }
	                });
	
	                if (!interrupted) {
	                    !hadError && action.onSuccess && goTo(action.onSuccess, store, next, finalPayload, finalMeta);
	                    hadError && action.onError && goTo(action.onError, store, next, finalPayload, finalMeta);
	                }
	                action.onComplete && goTo(action.onComplete, store, next);
	            });
	        };
	    };
	};

/***/ },
/* 1 */
/***/ function(module, exports) {

	module.exports = __WEBPACK_EXTERNAL_MODULE_1__;

/***/ }
/******/ ])
});
;
//# sourceMappingURL=library.js.map