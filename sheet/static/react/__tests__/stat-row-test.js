jest.dontMock('../StatRow');
jest.dontMock('../StatHandler');
jest.dontMock('./factories');

import React from 'react';
import ReactDOM from 'react-dom';
import TestUtils from 'react-addons-test-utils';

var rest = require('sheet-rest');
var factories = require('./factories');

const StatRow = require('../StatRow').default;
const StatHandler = require('../StatHandler').default;

var statRowFactory = function(givenProps) {
    // TODO: React TestUtils suck a bit of a balls.
    var Wrapper = React.createClass({
        render: function() {
            return <table><tbody>{this.props.children}</tbody></table>;
        }
    });
    var props = {
        stat: "fit",
        url: "/rest/characters/1/",
        initialChar: factories.characterFactory({
            start_fit: 50,
            cur_fit: 55,
            base_mod_fit: -2
        })
    };
    if (typeof(givenProps) !== "undefined") {
        props = Object.assign(props, givenProps);
    }
    var handler = new StatHandler({character: props.initialChar,
        edges: [],
        effects: [factories.sheetTransientEffectFactory({
            effect: {fit: 20}})]});
    props.effStats = handler.getEffStats();
    props.baseStats = handler.getBaseStats();
    var rowElement = React.createElement(StatRow, props);
    var table = TestUtils.renderIntoDocument(
        <Wrapper>
            {rowElement}
        </Wrapper>
    );

    return TestUtils.findRenderedComponentWithType(table,
        StatRow);
};

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

        row = statRowFactory();
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

describe('StatRow updates', function (){
    "use strict";

    var promises;
    var row;

    beforeEach(function () {
        rest.getData = jest.genMockFunction();
        rest.patch = jest.genMockFunction();
        promises = [];
    });

    var patchOk = function () {
        var response = Promise.resolve({"mockedPatch": 1});
        rest.patch.mockReturnValue(response);
        promises.push(response);
    };

    it('calls parent component set change callback', function (done) {
        patchOk({});
        var callback = jasmine.createSpy("callback");
        row = statRowFactory({onMod: callback});
        TestUtils.Simulate.click(row._decreaseButton);
        Promise.all(promises).then(function () {
            expect(rest.patch.mock.calls[0][0]).toEqual('/rest/characters/1/');
            Promise.all(promises).then(function () {
                Promise.all(promises).then(function () {
                expect(callback).toHaveBeenCalledWith("fit", 55, 54);
                done();
            }).catch(function (err) { fail(err);});;
            }).catch(function (err) { fail(err);});;
        }).catch(function (err) { fail(err);});
    });
});