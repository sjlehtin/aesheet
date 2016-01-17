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
        extensions: ['', '.js', '.jsx', '.css']
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
            },
            { test: /\.css$/, loader: 'style-loader!css-loader' },

            // From React-widgets documentation.
            { test: /\.less$/, loader: "style-loader!css-loader!less-loader" },
            { test: /\.gif$/, loader: "url-loader?mimetype=image/png" },
            { test: /\.woff(2)?(\?v=[0-9].[0-9].[0-9])?$/, loader: "url-loader?mimetype=application/font-woff" },
            { test: /\.(ttf|eot|svg)(\?v=[0-9].[0-9].[0-9])?$/, loader: "file-loader?name=[name].[ext]" },

            { test: /\.eot(\?v=\d+\.\d+\.\d+)?$/, loader: "file" },
            { test: /\.(woff|woff2)$/, loader:"url?prefix=font/&limit=5000" },
            { test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/, loader: "url?limit=10000&mimetype=application/octet-stream" },
            { test: /\.svg(\?v=\d+\.\d+\.\d+)?$/, loader: "url?limit=10000&mimetype=image/svg+xml" }
        ]
    }
};