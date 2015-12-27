/**
 * Preprocessor required to run "npm test" with "jest" as the test runner,
 * with webpack.
 *
 * Add
 *
 *   ...
 *   "jest": {
 *   "scriptPreprocessor": "<rootDir>/jest/preprocessor.js",
 *     ...
 *
 * to package.json to use.
 */
// jest/preprocessor.js
var babelJest = require('babel-jest');
var webpackAlias = require('jest-webpack-alias');

module.exports = {
  process: function(src, filename) {
    if (filename.indexOf('node_modules') === -1) {
        src = babelJest.process(src, filename);
        src = webpackAlias.process(src, filename);
    }
    return src;
  }
};
