import superagent from "superagent"

let config = {
    base : "",
    defaultHeaders : {
        "Content-Type" : "application/json",
    },
    hooks : {},
}

function goTo(action, store, next, payload, meta) {

    if (typeof action !== "function"){
        /* eslint-disable no-console */
        console.error("superagentMiddleware error : onStart, onSuccess, onError, onComplete must be functions");
        /* eslint-enable no-console */
        return
    }

    const res = action(payload, meta, store.dispatch, store.getState)
    res && next(res)
}

function responseHandler(response) {

    if (!response) {
        return { error : true, meta : { requestFailed : true } }
    }

    const res = { 
        error : true,
        payload : response.body,
        meta : {
            httpCode : response.status,
        },
    }
    if (response.status <= 300) {
        res.error = false
    }

    return res
}

const superagentMiddleware = store => next => action => {

    if (!action.request){
        return next(action)
    }

    // Cancelled status
    let cancelled = false

    // Requests configuration
    const requestActions = action.request instanceof Array ? action.request : [action.request]
    const requests = requestActions.map(requestAction => {
        let request = {
            base : requestAction.base || config.base,
            url : requestAction.url,
            method : requestAction.method || "GET",
            headers : { ...config.defaultHeaders, ...(requestAction.headers || {}) },
            params : { ...config.defaultParams, ...(requestAction.params || {}) },
            body : requestAction.body,
        }

        if (config.hooks.onRequest) {
            request = config.hooks.onRequest(store, action, request) || request
        }

        return request
    })

    // Requests execution
    action.onStart && goTo(action.onStart, store, next)
    const promiseList = []
    requests.map(request => {
        promiseList.push(new Promise(resolve => {
            const superagentRequest = superagent(request.method, request.base + request.url)
            request.params && superagentRequest.query(request.params)
            request.body && superagentRequest.send(request.body)
            superagentRequest.end((err, response) => {
                resolve(response)
            })
        }))
    })

    // Define cancel in action
    action.cancel = () => {
        cancelled = true
    }

    // Handling responses
    Promise.all(promiseList).then((responses) => {

        if (cancelled) {
            return
        }

        let interrupted = false
        let hadError = false
        let finalPayload = {}
        let finalMeta = {}
        responses.map((response, index) => {
            const test = responseHandler(response)

            if ((test.meta.requestFailed && config.hooks.onFailure && config.hooks.onFailure(store, action, requestActions[index], response) === false) ||
                (test.error && config.hooks.onError && config.hooks.onError(store, action, requestActions[index], response) === false)) {
                interrupted = true
            }
            if (test.error === true) {
                hadError = true
            }

            if (!(action.request instanceof Array)){
                finalPayload = test.payload,
                finalMeta = test.meta
            } else {
                const name = requestActions[index].name || "request_" + index
                finalPayload[name] = test.payload
                finalMeta[name] = test.meta
            }
        })

        if (!interrupted) {
            !hadError && action.onSuccess && goTo(action.onSuccess, store, next, finalPayload, finalMeta)
            hadError && action.onError && goTo(action.onError, store, next, finalPayload, finalMeta)
        }
        action.onComplete && goTo(action.onComplete, store, next)
    })
}

export default function(customConfig){
    config = {...config, ...customConfig}
    return superagentMiddleware
}
