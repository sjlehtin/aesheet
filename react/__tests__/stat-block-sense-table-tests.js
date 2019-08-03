import React from 'react';
import TestUtils from 'react-dom/test-utils';

jest.mock('../sheet-rest');

const factories = require('./factories');

const SenseTable = require('../SenseTable').default;

describe('stat block -- sense table', function() {
    "use strict";

    it('contains a SenseTable component', function (done) {
        let block = factories.statBlockFactory();
        block.afterLoad(function () {
            const senseTable = TestUtils.findRenderedComponentWithType(
                block, SenseTable);
            expect(TestUtils.isCompositeComponent(senseTable)).toBe(true);
            done();
        });
    });

});
