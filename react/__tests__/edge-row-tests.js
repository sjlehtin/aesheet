import createReactClass from "create-react-class";

jest.dontMock('../EdgeRow');
jest.dontMock('../sheet-util');
jest.dontMock('./factories');

/*
Coverage before adding test file
File                             | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
  EdgeRow.js                     |   77.77 |       50 |      75 |   77.77 | 15,31
 */
import React from 'react';
import ReactDOM from 'react-dom';
import TestUtils from 'react-dom/test-utils';
const characterEdgeFactory = require('./factories').characterEdgeFactory;

const EdgeRow = require('../EdgeRow').default;

jest.mock('../sheet-rest');
var rest = require('../sheet-rest');

var edgeRowFactory = function(givenProps) {
    const Wrapper = createReactClass({
        render: function () {
            return <table>
                <tbody>{this.props.children}</tbody>
            </table>;
        }
    });

    let props = Object.assign(givenProps, {edge:  characterEdgeFactory(givenProps.edge)})
    let rowElement = React.createElement(EdgeRow, props);
    let table = TestUtils.renderIntoDocument(
        <Wrapper>
            {rowElement}
        </Wrapper>
    );

    return TestUtils.findRenderedComponentWithType(table,
        EdgeRow);
};

describe('EdgeRow', function() {

    it("can toggle the ignore_cost field", function () {
        const spy = jasmine.createSpy();

        const edge = characterEdgeFactory({edge: {edge: {name: "Foo edge"}}, level: 2, ignore_cost: true});

        let expected = Object.assign({}, edge);
        delete expected.edge;
        expected.ignore_cost = false;

        const control = edgeRowFactory({
            edge: edge,
            onChange: spy
        });

        TestUtils.Simulate.change(ReactDOM.findDOMNode(control._toggleIgnoreCost));

        expect(spy).toHaveBeenCalledWith(expected);
    });

    it("can remove the edge", function () {
        const spy = jasmine.createSpy();

        const edge = characterEdgeFactory({edge: {edge: {name: "Foo edge"}}, level: 2});

        let expected = Object.assign({}, edge);
        delete expected.edge;

        const control = edgeRowFactory({
            edge: edge,
            onRemove: spy
        });

        TestUtils.Simulate.click(ReactDOM.findDOMNode(control._removeButton));

        expect(spy).toHaveBeenCalledWith(expected);
    });
});