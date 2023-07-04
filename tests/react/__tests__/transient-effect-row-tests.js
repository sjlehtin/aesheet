jest.dontMock('TransientEffectRow');
jest.dontMock('sheet-util');
jest.dontMock('./factories');
import React from 'react';
import ReactDOM from 'react-dom';
import TestUtils from 'react-dom/test-utils';
import createReactClass from 'create-react-class';

const TransientEffectRow = require('TransientEffectRow').default;

var factories = require('./factories');

describe('TransientEffectRow', function() {
    "use strict";

    var getTransientEffectRow = function (givenProps) {
        var Wrapper = createReactClass({
            render: function () {
                return <table>
                    <tbody>{this.props.children}</tbody>
                </table>;
            }
        });

        var props = {
            effect: factories.sheetTransientEffectFactory()
        };
        if (givenProps) {
            props = Object.assign(props, givenProps);
        }
        var table = TestUtils.renderIntoDocument(
            <Wrapper>
                <TransientEffectRow {...props}/>
            </Wrapper>
        );

        return TestUtils.findRenderedComponentWithType(table,
            TransientEffectRow);
    };

    it("renders the effect name", function () {
        var effect = getTransientEffectRow({
            effect: factories.sheetTransientEffectFactory(
                {effect: {name: "Foobaz"}})
        });
        expect(ReactDOM.findDOMNode(effect).textContent).toContain("Foobaz");
    });

    it("renders the effects", function () {
        var effect = getTransientEffectRow({
            effect: factories.sheetTransientEffectFactory(
                {effect: {name: "Foobaz",
                fit: 5,
                ref: -1}})
        });
        var textContent = ReactDOM.findDOMNode(effect).textContent;
        expect(textContent).toContain("+5");
        expect(textContent).toContain("-1");
    });

    it("should not render non-effects", function (){
        var effect = getTransientEffectRow({
            effect: factories.sheetTransientEffectFactory(
                {effect: {name: "Foobaz"}})
        });
        var textContent = ReactDOM.findDOMNode(effect).textContent;
       expect(textContent).not.toContain("0");
    });

    it("should not render notes or similar fields", function (){
        // Notes are gathered by the stat block.
        // TODO: not yet, test for it in statblock tests.
        var effect = getTransientEffectRow({
            effect: factories.sheetTransientEffectFactory(
                {effect: {name: "Foobaz",
                    notes: "Causes lack of vision and dizziness"}})
        });
        var textContent = ReactDOM.findDOMNode(effect).textContent;
        expect(textContent).not.toContain("vision");
        expect(textContent).not.toContain("enhancement");
        expect(textContent).not.toContain("tech_level");
    });

    it("should not render name in effects", function (){
        // Notes are gathered by the stat block.
        // TODO: not yet, test for it in statblock tests.
        var effect = getTransientEffectRow({
            effect: factories.sheetTransientEffectFactory(
                {effect: {name: "Foobaz"}})
        });
        var textContent = ReactDOM.findDOMNode(effect).textContent;
        expect(textContent).not.toContain("name");
        var firstIndex = textContent.indexOf("Foobaz");
        expect(firstIndex).toBeGreaterThan(-1);
        var secondIndex = textContent.indexOf("Foobaz", firstIndex + 1);
        expect(secondIndex).toEqual(-1);
    });

    it("should render description as title", function () {
        var effect = getTransientEffectRow({
            effect: factories.transientEffectFactory(
                {effect: {name: "Foobaz",
                description: "foobar"}})
        });
        var node = ReactDOM.findDOMNode(effect);
        var textContent = node.textContent;
        expect(textContent).not.toContain("description");
        expect(node.getAttribute("title")).toContain("foobar");
    });

    it("calls onRemove on remove button press", function () {
        var callback = jasmine.createSpy("callback");
        var effect = getTransientEffectRow({
            effect: factories.sheetTransientEffectFactory(),
            onRemove: callback
        });
        TestUtils.Simulate.click(ReactDOM.findDOMNode(
            effect._removeButton));
        expect(callback).toHaveBeenCalled();
    });
});