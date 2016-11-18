var webpack = require("webpack")
var path = require("path")
var libraryName = "library"

var env = process.env.WEBPACK_ENV

module.exports = {
    entry : __dirname + "/src/index.js",
    devtool : "source-map",
    output : {
        path: __dirname + "/lib",
        filename : libraryName + (env === "build" ? ".min.js" : ".js"),
        library : libraryName,
        libraryTarget: "umd"
    },
    resolve: {
        path : path.resolve("./src"),
        extensions : ["", ".js"]
    },
    externals: [{
        superagent: 'superagent'
    }],
    module : {
        loaders : [
            {
                test: /\.js$/,
                loader: "babel",
                exclude: "node_modules"
            }
        ]
    },
    plugins : env === "build" ? [
        new webpack.optimize.UglifyJsPlugin({ minimize : true })
    ] : []
}
