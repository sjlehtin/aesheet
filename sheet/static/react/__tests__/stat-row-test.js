jest.dontMock('../StatRow');

import React from 'react';
import ReactDOM from 'react-dom';
import TestUtils from 'react-addons-test-utils';

var rest = require('sheet-rest');

const StatRow = require('../StatRow').default;

describe('stat row', function() {
    "use strict";

    var promises;
    var row;

    var patchOk = function () {
        var response = Promise.resolve({});
        rest.patch.mockReturnValue(response);
        promises.push(response);
    };

    beforeEach(function () {
        rest.getData = jest.genMockFunction();
        rest.patch = jest.genMockFunction();
        promises = [];

        // TODO: React TestUtils suck a bit of a balls.
        var Wrapper = React.createClass({
            render: function() {
                return <table><tbody>{this.props.children}</tbody></table>;
            }
        });
        var table = TestUtils.renderIntoDocument(
            <Wrapper>
                <StatRow stat="fit"
                         url="/rest/characters/1/"
                         initialChar={{
                         start_fit: 50,
                         cur_fit: 55,
                         mod_fit: -2
                         }} initialSheet={{mod_fit: 20}}
            />
            </Wrapper>
        );

        row = TestUtils.findRenderedComponentWithType(table,
            StatRow);
    });

    it('renders to a row', function () {
        var rowContents = TestUtils.scryRenderedDOMComponentsWithTag(row, "td").map(
            (node) => { return node.textContent } );
        expect(rowContents.join('')).not.toContain("NaN");
        var intValues = rowContents.map((value) => { return parseInt(value) });
        expect(intValues).toContain(53);
        expect(intValues).toContain(73);
    });

    it ('updates increases to the server', function (done) {
        patchOk({});
        TestUtils.Simulate.click(row._increaseButton);
        Promise.all(promises).then(function () {
            expect(rest.patch.mock.calls[0][0]).toEqual('/rest/characters/1/');
            expect(rest.patch.mock.calls[0][1]).toEqual({cur_fit: 56});

            expect(row.state.cur).toEqual(56);

            done();
        });
    });

    it ('updates decreases to the server', function (done) {
        patchOk({});
        TestUtils.Simulate.click(row._decreaseButton);
        Promise.all(promises).then(function () {
            expect(rest.patch.mock.calls[0][0]).toEqual('/rest/characters/1/');
            expect(rest.patch.mock.calls[0][1]).toEqual({cur_fit: 54});

            expect(row.state.cur).toEqual(54);

            done();
        });
    });
});