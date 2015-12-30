var path = require('path');
var webpack = require('webpack');

var plugins = [
        new webpack.ProvidePlugin({
            'fetch': 'imports?this=>global!exports?global.fetch!whatwg-fetch'
        })
    ];

var minimize = process.argv.indexOf('--no-minimize') === -1 ? true : false;

if (minimize) {
    plugins.push(new webpack.optimize.UglifyJsPlugin({minimize: true}));
}

module.exports = {
    entry: "./main.js",
    output: {
        path: __dirname,
        filename: "bundle.js",
        // Expose the bundle to a var for the Django templates.
        libraryTarget: "var",
        library: "SheetApp"
    },

    plugins: plugins,

    resolve: {
        root: path.resolve('.'),
        extensions: ['', '.js', '.jsx']
    },
    module: {
        loaders: [
            {
                test: /\.jsx?$/,
                loader: "babel",
                exclude: /node_modules/,
                query: {
                    presets: ['react', "es2015"]
                }
            }
        ]
    }
};