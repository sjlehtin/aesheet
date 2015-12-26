.babelrc required for the time being because babel-jest does not understand
presets in webpack.

require() does not recognize .jsx suffix automatically, so using .js suffix
for the time being.  The "resolve" directive in webpack.config.js does not
work, even with the non-default preprocessor for jest.

JS tests are run with "npm test".