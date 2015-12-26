var path = require('path');

module.exports = {
    entry: "./main.js",
    output: {
        path: __dirname,
        filename: "bundle.js"
    },
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