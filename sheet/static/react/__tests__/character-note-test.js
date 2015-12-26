jest.dontMock('../Character');

import React from 'react';
import ReactDOM from 'react-dom';
import TestUtils from 'react-addons-test-utils';

const Character = require('../Character').default;

describe('character note tests', function (){
    "use strict";
    it('starts in non-editing mode', function () {
        var character = TestUtils.renderIntoDocument(
            <Character />
        );
        var characterNode = ReactDOM.findDOMNode(character);

        expect(characterNode.textContent).toContain('Edit');

    })
});

