jest.dontMock('../XPControl');
jest.dontMock('../sheet-util');

import React from 'react';
import ReactDOM from 'react-dom';
import TestUtils from 'react-dom/test-utils';

var rest = require('../sheet-rest');

const XPControl = require('../XPControl').default;

describe('XPControl', function() {
    "use strict";

    var promises;

    var charDataFactory = function (statOverrides) {
        var _charData = {
            id: 2,

            "start_fit": 43,
            "start_ref": 43,
            "start_lrn": 43,
            "start_int": 43,
            "start_psy": 43,
            "start_wil": 43,
            "start_cha": 43,
            "start_pos": 43,
            "cur_fit": 80,
            "cur_ref": 50,
            "cur_lrn": 47,
            "cur_int": 46,
            "cur_psy": 43,
            "cur_wil": 44,
            "cur_cha": 62,
            "cur_pos": 48,
            bought_mana: 0,
            bought_stamina: 0,
            free_edges: 0,

            total_xp: 0
        };

        return Object.assign(_charData, statOverrides);
    };


    var xpControlFactory = function(givenProps) {
        var props = {
            url: "/rest/characters/1/",
            initialChar: charDataFactory(),
            edgesBought: 0
        };

        if (typeof(givenProps) !== "undefined") {
            props = Object.assign(props, givenProps);
        }
        var control = React.createElement(XPControl, props);

        var node = TestUtils.renderIntoDocument(control);
        return TestUtils.findRenderedComponentWithType(node,
            XPControl);
    };

    beforeEach(function () {
        rest.getData = jest.fn();
        rest.patch = jest.fn();
        promises = [];
    });

    it('can calculate used xp', function (){
        expect(XPControl.calculateStatRaises(charDataFactory())).toEqual(76);
        expect(XPControl.calculateStatRaises(charDataFactory({bought_mana: 2}))).toEqual(78);
        expect(XPControl.calculateStatRaises(charDataFactory({bought_stamina: 2}))).toEqual(78);
    });

    it('can calculate used xp from edges', function () {
        var control = xpControlFactory();
        expect(control.xpEdgesBought()).toEqual(0);
    });

    it('can take free edges into account', function () {
        var control = xpControlFactory({
            edgesBought: 3, initialChar:
            charDataFactory({free_edges: 2})});
        expect(control.xpEdgesBought()).toEqual(25);
    });

    it('will not allow negative cost from free edges', function () {
        var control = xpControlFactory({
            edgesBought: 3, initialChar:
            charDataFactory({free_edges: 4})});
        expect(control.xpEdgesBought()).toEqual(0);
    });

    var jsonResponse = function (json) {
        var promise = Promise.resolve(json);
        promises.push(promise);
        return promise;
    };

    it('calls parent component set change callback', function (done) {
        rest.patch.mockReturnValue(jsonResponse({}));

        var callback = jasmine.createSpy("callback");
        var control = xpControlFactory({onMod: callback,
            initialChar: charDataFactory({total_xp: 60})});

        TestUtils.Simulate.click(control.getAddDOMNode());

        var input = control.getInputDOMNode();
        /* Required with Bootstrap. */
        input.value = 200;
        TestUtils.Simulate.change(input, {target: {value: 200}});

        control.handleSubmit(new Event("submit", {}));

        Promise.all(promises).then(function () {
            expect(rest.patch.mock.calls[0][0]).toEqual('/rest/characters/1/');
            expect(rest.patch.mock.calls[0][1]).toEqual({total_xp: 260});

            Promise.all(promises).then(function () {
                expect(callback).toHaveBeenCalledWith("total_xp", 60, 260);
                done();
            }).catch(function (err) { fail(err);});;
        }).catch(function (err) { fail(err);});
    });

    it('reacts to input', function () {
        var control = xpControlFactory({
            initialChar: charDataFactory({total_xp: 60})
        });

        expect(control.state.addXP).toEqual(0);

        TestUtils.Simulate.click(control.getAddDOMNode());

        var input = control.getInputDOMNode();
        input.value = 200;
        TestUtils.Simulate.change(
            control.getInputDOMNode(), {target: {value: 200}});
        expect(control.state.addXP).toEqual(200);
    });

    it('allows dialog to be shown', function () {
        var control = xpControlFactory();
        expect(control.state.showDialog).toBe(false);
        TestUtils.Simulate.click(control.getAddDOMNode(), {});
        expect(control.state.showDialog).toBe(true);
    });

    it('validates integer values', function () {
        var control = xpControlFactory();
        TestUtils.Simulate.click(control.getAddDOMNode());
        var input = control.getInputDOMNode();
        TestUtils.Simulate.change(input, {target: {value: "20a"}});

        expect(control.validationState()).toEqual("error");

        TestUtils.Simulate.change(input, {target: {value: "tsap"}});

        expect(control.validationState()).toEqual("error");

        TestUtils.Simulate.change(input, {target: {value: 10}});

        expect(control.validationState()).toEqual("success");

        TestUtils.Simulate.change(input, {target: {value: "10"}});

        expect(control.validationState()).toEqual("success");
    });

    it('allows adding to be canceled', function () {
        var control = xpControlFactory();
        TestUtils.Simulate.click(control.getAddDOMNode());
        var input = control.getInputDOMNode();
        input.value = 200;
        TestUtils.Simulate.change(input, {target: {value: 200}});

        expect(control.state.addXP).toEqual(200);

        /* TODO: it would be nice to trigger the cancel by triggering the
         dialog, but the DOM manipulation seems to be a bit tricky.  For
          later... */
        control.handleCancel();
        expect(control.state.addXP).toEqual(0);
        expect(control.state.showDialog).toBe(false);
    });

    it('reacts to submit button', function (done) {
        var control = xpControlFactory();
        var response = jsonResponse({});
        rest.patch.mockReturnValue(response);

        var spy = spyOn(control, 'handleSubmit');

        TestUtils.Simulate.click(control.getAddDOMNode());
        TestUtils.Simulate.submit(control.getSubmitDOMNode());
        response.then(function () {
            expect(spy).toHaveBeenCalled();
            done();
        });
    });
});
