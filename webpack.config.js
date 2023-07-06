var path = require('path');

module.exports = {
    entry: "main.js",
    output: {
        path: __dirname + '/npmbuild/static/react',
        filename: "bundle.js",
        // Expose the bundle to a var for the Django templates.
        libraryTarget: "var",
        library: "SheetApp",
        publicPath: "/static/react/"
    },

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
                    {"loader": "style-loader"},
                    {"loader": "css-loader"},
                    {"loader": "sass-loader"}
                ]
            },
            {
                test: /\.(sass|scss)$/,
                use: [
                    {"loader": "style-loader"},
                    {"loader": "css-loader"},
                    {"loader": "sass-loader"}
                ]
            },

            {
                test: /\.gif$/,
                use: {loader: "url-loader", options: {mimetype: "image/png"}}
            },

            {
                test: /\.woff(2)?(\?v=\d+\.\d+\.\d+)?$/,
                use: {
                    loader: "url-loader",
                    "options": {
                        "limit": 10000,
                        "mimetype": "application/font-woff"
                    }
                }
            },
            {
                test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/,
                use: {
                    loader: "url-loader",
                    "options": {
                        "limit": 10000,
                        "mimetype": "application/octet-stream"
                    }
                }
            },
            {test: /\.eot(\?v=\d+\.\d+\.\d+)?$/, loader: "file-loader"},
            {
                test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,
                use: {
                    loader: "url-loader",
                    "options": {"limit": 10000, mimetype: "image/svg+xml"}
                }
            }
        ]
    },
    devServer: {
        writeToDisk: true
    }
};