.babelrc required for the time being because babel-jest does not understand
presets in webpack.

require() does not recognize .jsx suffix automatically, so using .js suffix
for the time being.  The "resolve" directive in webpack.config.js does not
work, even with the non-default preprocessor for jest.

JS tests are run with "npm test".

Lots of dependencies for react-bootstrap needed to be added to the
unmockedModulePathPatterns in the jest configuration in package.json; this
is mentioned here because the package.json does not allow comments.

TODO: armor
TODO: stat modifiers from armor
TODO: stat modifiers from weaponspecialqualities in weapons
TODO: stat modifiers from armorspecialqualities in armor
TODO: stat modifiers from specialqualities in miscellaneous items
TODO: edge skill bonuses
TODO: edge add and remove
TODO: misc item add and remove
TODO: movement
TODO: senses
TODO: spell skill checks

