jest.dontMock('../TransientEffectRow');
jest.dontMock('../sheet-util');
jest.dontMock('./factories');
import React from 'react';
import ReactDOM from 'react-dom';
import TestUtils from 'react-addons-test-utils';

const TransientEffectRow = require('../TransientEffectRow').default;
const SkillHandler = require('../SkillHandler').default;

var rest = require('sheet-rest');

var factories = require('./factories');

describe('TransientEffectRow', function() {
    "use strict";

    var getTransientEffectRow = function (givenProps) {
        var Wrapper = React.createClass({
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
            effect: factories.transientEffectFactory(
                {effect: {name: "Foobaz"}})
        });
        expect(ReactDOM.findDOMNode(effect).textContent).toContain("Foobaz");
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