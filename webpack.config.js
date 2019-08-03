var path = require('path');
var webpack = require('webpack');

// var plugins = [
//         new webpack.ProvidePlugin({
//             'fetch': 'imports-loader?this=>global!exports-loader?global.fetch!whatwg-fetch'
//         })
//     ];

// const minimize = process.argv.indexOf('--no-minimize') === -1;
//
// if (minimize) {
//     plugins.push(new webpack.optimize.UglifyJsPlugin({minimize: true}));
// }

module.exports = {
    entry: "main.js",
    output: {
        path: __dirname + '/sheet/static/react',
        filename: "bundle.js",
        // Expose the bundle to a var for the Django templates.
        libraryTarget: "var",
        library: "SheetApp",
        publicPath: "/static/react/"
    },

    // plugins: plugins,

    resolve: {
        modules: [path.resolve(__dirname, 'react'), 'node_modules'],
        extensions: ['.js', '.jsx', '.css']
    },
    module: {
        rules: [
            {
                test: /\.m?jsx?$/,
                exclude: /node_modules/,
                use: {
                    loader: "babel-loader",
                    options: {
                        presets: ["@babel/preset-env", "@babel/preset-react"]
                    }
                }
            },
            {
                test: /\.css$/,
                use: [
                    'style-loader',
                    {
                        loader: 'css-loader',
                        options: {
                            importLoaders: 1
                        }
                    }
                ]
            },

            // From React-widgets documentation.
            {
                test: /\.less$/,
                use: [
                "style-loader",
                "css-loader",
                "less-loader"
                ]
            },
            // {
            //     test: /\.scss$/,
            //     use: [
            //     "style-loader",
            //     "css-loader",
            //     "scss-loader"
            //     ]
            // },

             {
                test: /\.(sass|scss)$/,
        loader: [
          'style-loader',
          'css-loader',
            'sass-loader'
        ]
      },

            { test: /\.gif$/, loader: "url-loader?mimetype=image/png" },

            {test: /\.woff(2)?(\?v=\d+\.\d+\.\d+)?$/, loader: "url-loader?limit=10000&mimetype=application/font-woff" },
            {test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/, loader: "url-loader?limit=10000&mimetype=application/octet-stream" },
            {test: /\.eot(\?v=\d+\.\d+\.\d+)?$/, loader: "file-loader" },
            {test: /\.svg(\?v=\d+\.\d+\.\d+)?$/, loader: "url-loader?limit=10000&mimetype=image/svg+xml" }

//            //{ test: /\.(otf|eot|svg|ttf|woff|woff2).*$/, loader: 'url-loader?limit=10000&mimetype=application/octet-stream' },
//            { test: /\.woff(2)?(\?v=[0-9].[0-9].[0-9])?$/, loader: "url-loader?mimetype=application/font-woff" },
//            //{ test: /\.(ttf|eot|svg)(\?v=[0-9].[0-9].[0-9])?$/, loader: "file-loader?name=[name].[ext]" },
//
//            { test: /.(png|woff(2)?|eot|ttf|svg)(\?[a-z0-9=\.]+|#[a-z]+)?$/, loader: 'url-loader?limit=100000&mimetype=application/octet-stream' },
//            { test: /.(png|woff(2)?|eot|ttf|svg).*$/, loader: 'url-loader?limit=100000&mimetype=application/octet-stream' },
//            //{ test: /\.eot(\?v=\d+\.\d+\.\d+)?$/, loader: "file" },
////            { test: /\.(woff|woff2)$/, loader:"url?prefix=font/&limit=5000" },
//            { test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/, loader: "url?limit=10000&mimetype=application/octet-stream" },
//            //{ test: /\.svg(\?v=\d+\.\d+\.\d+)?$/, loader: "url?limit=10000&mimetype=image/svg+xml" },
//
//            //{ test: /\.css$/, loader: 'style!css'},
//            //{ test: /\.(otf|eot|svg|ttf|woff|woff2).*$/, loader: 'url?limit=8192' }
        ]
    }
};