.babelrc required for the time being because babel-jest does not understand
presets in webpack.

require() does not recognize .jsx suffix automatically, so using .js suffix
for the time being.  The "resolve" directive in webpack.config.js does not
work, even with the non-default preprocessor for jest.

JS tests are run with "npm test".

Lots of dependencies for react-bootstrap needed to be added to the
unmockedModulePathPatterns in the jest configuration in package.json; this
is mentioned here because the package.json does not allow comments.

Items still to be done are found in sheet/templates/todo.html.

Reactifying and RESTifying the sheet should never result in test
coverage of the sheet functionality in getting worse; it should only increase,
but naturally with the focus moving towards the JavaScript unit-tests and
perhaps Robot-system tests.
