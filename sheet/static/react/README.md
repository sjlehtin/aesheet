.babelrc required for the time being because babel-jest does not understand
presets in webpack.

require() does not recognize .jsx suffix automatically, so using .js suffix
for the time being.  The "resolve" directive in webpack.config.js does not
work, even with the non-default preprocessor for jest.

JS tests are run with "npm test".

Lots of dependencies for react-bootstrap needed to be added to the
unmockedModulePathPatterns in the jest configuration in package.json; this
is mentioned here because the package.json does not allow comments.

TODO: sense modifiers from armor
TODO: skill modifiers from armor
TODO: edge skill bonuses
TODO: senses
TODO: spell skill checks

TODO: environment effects on movement as an overlay
TODO: environment effects on overland movement as an overlay
TODO: tiring: show tiring durations in the sheet
TODO: tiring: account for armor encumbrance class
TODO: tiring: allow adding turns fought, sprinted etc

TODO: overland movement double time

Reactifying and RESTifying the sheet should never result in test
coverage of the sheet functionality in getting worse; it should only increase,
but naturally with the focus moving towards the JavaScript unit-tests and
perhaps Robot-system tests.
