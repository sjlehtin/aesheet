jest.dontMock('../AddTransientEffectControl');
jest.dontMock('./factories');
import React from 'react';
import ReactDOM from 'react-dom';
import TestUtils from 'react-addons-test-utils';

const AddTransientEffectControl = require('../AddTransientEffectControl').default;

jest.mock('../sheet-rest');
var rest = require('../sheet-rest');

var factories = require('./factories');

describe('AddTransientEffectControl', function() {
    "use strict";

    var promises = [];

    beforeEach(function () {
        promises = [];
    });

    var getAddTransientEffectControl = function (givenProps) {
        var Wrapper = React.createClass({
            render: function () {
                return <table>
                    {this.props.children}
                </table>;
            }
        });

        var props = {
            allEffects: [factories.transientEffectFactory()]
        };
        if (typeof(givenProps) !== "undefined") {
            props = Object.assign(props, givenProps);
        }
        var table = TestUtils.renderIntoDocument(
            <Wrapper>
                <AddTransientEffectControl {...props}/>
            </Wrapper>
        );

        return TestUtils.findRenderedComponentWithType(table,
            AddTransientEffectControl);
    };

    it("calls parent add", function (done) {
        var callback = jasmine.createSpy("callback");
        var effect = factories.transientEffectFactory({name: "Tsup"});
        rest.getData.mockReturnValue(Promise.resolve([effect]));
        var control = getAddTransientEffectControl({
            campaign: 2,
            onAdd: callback
        });

        Promise.all(promises).then(function () {
            var node = ReactDOM.findDOMNode(control._addButton);
            expect(node.hasAttribute('disabled')).toEqual(true);
            control.handleChange(effect);
            expect(node.hasAttribute('disabled')).toEqual(false);
            TestUtils.Simulate.click(node);
            expect(callback).toHaveBeenCalled();
            done();
        }).then((err) => fail(err));
    });

    it("does not allow invalid values to be added", function () {
        var control = getAddTransientEffectControl();
        var node = ReactDOM.findDOMNode(control._addButton);
        expect(node.hasAttribute('disabled')).toEqual(true);
        control.handleChange("foo");
        expect(control.isValid()).toBe(false);
    });
});