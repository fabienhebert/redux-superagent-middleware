# redux-superagent-middleware

## Usage

You must create an instance of the middleware. It allows you to specific a configuration. Then append the instantiated middleware to redux's applyMiddleware :

``` js
import superagentMiddleware from "redux-superagent-middleware"

const superagentMiddlewareInstance = superagentMiddleware({
    base : "http://amazing.api",
    defaultHeaders : {
        ["Content-type"] : "application/json"
    },
    hooks : {
        onRequest: (store, action, request) => { ... },
        onFailure: (store, action, request, response) => { ... },
        onError: (store, action, request, response) => { ... }
    }
})

const store = createStore(
    rootReducer,
    compose(
        applyMiddleware(superagentMiddlewareInstance, thunkMiddleware, routerMiddleware(browserHistory)),
        window.devToolsExtension && !__PROD__ ? window.devToolsExtension() : f => f
    )
)
```

Then you can create and dispatch an appropriate action : 

``` js
dispatch({
    request : {
        url : "/v1/products"
    },
    onStart,
    onSuccess,
    onError,
    onComplete,
})
```

## Middleware configuration options

### base [STRING]

Allow you to define the base of url (without pathname, parameters, ...). Example : http://api.com

### defaultHeaders [OBJECT]

Request's headers used in each request. Example : 

``` js
const superagentMiddlewareInstance = superagentMiddleware({
    defaultHeaders : {
        ["Content-type"] : "application/json"
    },
    ...
})
```

### defaultParams [OBJECT]

Request's query params used in each request. Example : 

``` js
const superagentMiddlewareInstance = superagentMiddleware({
    defaultParams : {
        ["api_key"] : "1234567890"
    },
    ...
})
```

### Hooks : onRequest [FUNCTION]

You can specify a function called before each request, it allows you to modify it before xhr call.

This function have the following parameters :

**store** : redux store
**action** : custom dispatched flux action
**request** : the pre-request built by middleware before xhr call

Return the modified request to apply modifications

Example : 

``` js
const superagentMiddlewareInstance = superagentMiddleware({
    hooks : {
        onRequest : (store, action, request) => {
            const state = store.getState()
            const token = state.session.token

            if (action.setToken === true){
                request.params["token"] = token
            }
            
            return request
        }
    }
})
```

### Hooks : onFailure [FUNCTION]

You can specify a function called if the request failed (connection error).

This hook is trigger before action.onError, action.onComplete, hooks.onError and you can interrupt middleware process by returning false

This function have these following parameters :

**store** : redux store
**action** : custom dispatched flux action
**request** : the request used for xhr call
**response** : xhr call's response

Example : 

``` js
const superagentMiddlewareInstance = superagentMiddleware({
    hooks : {
        onFailure : (store, action, request, response) => {
            Logger.send("request_failed", "....")
        }
    }
})
```

### Hooks : onError [FUNCTION]

You can specify a function called if the request failed (connection error).

This hook is trigger before action.onError, action.onComplete and you can interrupt middleware process by returning false

This function have these following parameters :

**store** : redux store
**action** : custom dispatched flux action
**request** : the request used for xhr call
**response** : xhr call's response

Example : 

``` js
const superagentMiddlewareInstance = superagentMiddleware({
    hooks : {
        onFailure : (store, action, request, response) => {
            if (response.status === 401){
                this.store.dispatch(logout())
                
                // Prevent onError / onComplete if they are specified in action
                return false
            }
        }
    }
})
```

## Action configuration options

### request [OBJECT]

Request object supports these parameters :
**base** (optional) : Specify the base of url of this request (example : http://anotherapi.com), it overload middleware config's base
**url** (mandatory) : Specify the pathname (example : /v3/test ) or the complete url (http://test.api/v4/test)
**method** (default value : GET) : http verb (GET/POST/PUT/DELETE/PATCH ...)
**params** : query

``` js
const customAction = {
    request : {
        base : "http://anotherapi.com",
        url : "v1/user",
        method : "POST",
        body : {
            email : "test@test.te",
            password : "example"
        }
    },
    ........ others options
}
```

``` js
const customAction = {
    request : {
        base : "http://anotherapi.com",
        url : "v1/user",
        method : "DELETE", 
        params : {
            user_id: 1337,
        }
    },
    ........ others options
}
```

### Listeners [FUNCTIONs]

You can add 4 listeners, these listeners is function which accept 4 parameters :
payload [mixed] : response.body
meta [object] : metadata of the response, including httpCode
dispatch [function] : redux's dispatch function
getState [function] : redux's getState function

- onStart : call before a request is executed (after onRequest hook) 
- onSuccess : call when the request is done with a statusCode/httpCode < 300
- onError : call when the request is done with a statusCode/httpCode >= 300
- onComplete : call when the request is done

The listener can return a flux action which is sent to the next middleware

``` js
const customAction = {
    request : {
        base : "http://anotherapi.com",
        url : "v1/user",
        method : "DELETE", 
        params : {
            user_id: 1337,
        }
    },
    onStart : () => {
        return {
            type : "REQUEST_PENDING"
        }
    },
    onSuccess : (payload, meta, dispatch) => {
        // dispatch is useful is the new action must pass throught all middleware
         // Or if you need to dispatch more than one action
        dispatch({
            ...
        })
        // And you can do one/severals dispatch, and then use return 
        return {
            type : "REQUEST_SUCCESS",
            payload
        }
    },
    onError : () => {
        // Do something if the httpCode if >= 300
    },
    onComplete : () => {
        return {
            type : "STOP_SPINNER"
        }
    }
}
```

## Parallel requests

You can do several requests in the same action, listeners like onStart or onSuccess are call only once, when the first request start for onStart, and when all request are complete for onSuccess, onError and onComplete

If you interrupt the process in a config.hook like onFailure by returning false, all requests are interrupt

In order to recognize the request's response in the success/error payload you can give a name for the request (otherwise it is request_${index} )

Usage : 
``` js
const customAction = {
    request : [ // You specify an array for request paramater
        { // FIRST SUB-REQUEST
            name : "userList",
            url : "/users/",
        },
        { // SECOND SUB-REQUEST
            name : "productList",
            url : "product",
        },
    ],
    onSuccess : (payload) => {
        console.log(payload.userList, payload.productList)
    }
}
```
