jest.dontMock('../XPControl');

import React from 'react';
import ReactDOM from 'react-dom';
import TestUtils from 'react-addons-test-utils';

var rest = require('sheet-rest');

const XPControl = require('../XPControl').default;
import { calculateStatRaises } from '../XPControl';



describe('stat block', function() {
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
            bought_stamina: 0
        };

        return Object.assign(_charData, statOverrides);
    };


    var xpControlFactory = function(givenProps) {
        //// TODO: React TestUtils suck a bit of a balls.
        //var Wrapper = React.createClass({
        //    render: function() {
        //        return <table><tbody>{this.props.children}</tbody></table>;
        //    }
        //});
        var props = {
            url: "/rest/characters/1/",
            initialChar: charDataFactory()
        };
        if (typeof(givenProps) !== "undefined") {
            props = Object.assign(props, givenProps);
        }
        var control = React.createElement(XPControl, props);

        //var table = TestUtils.renderIntoDocument(
        //    <Wrapper>
        //        {rowElement}
        //    </Wrapper>
        //);

        var node = TestUtils.renderIntoDocument(control);
        return TestUtils.findRenderedComponentWithType(node,
            XPControl);
    };

    beforeEach(function () {
        rest.getData = jest.genMockFunction();
        rest.patch = jest.genMockFunction();
        promises = [];
    });

    it('can calculate used xp', function (){
        expect(XPControl.calculateStatRaises(charDataFactory())).toEqual(76);
        expect(XPControl.calculateStatRaises(charDataFactory({bought_mana: 2}))).toEqual(78);
        expect(XPControl.calculateStatRaises(charDataFactory({bought_stamina: 2}))).toEqual(78);
    });

    //it('calls parent component set change callback', function (done) {
    //    patchOk({});
    //    var callback = jasmine.createSpy("callback");
    //    var control = xpControlFactory({onMod: callback, totalXP: 60});
    //        TestUtils.Simulate.change(control._xpField,
    //            {target: {value: 200}});
    //    TestUtils.Simulate.click(control._addButton);
    //
    //    Promise.all(promises).then(function () {
    //        expect(rest.patch.mock.calls[0][0]).toEqual('/rest/characters/1/');
    //        expect(rest.patch.mock.calls[0][1]).toEqual({total_xp: 260});
    //
    //        Promise.all(promises).then(function () {
    //            expect(callback).toHaveBeenCalledWith("total_xp", 60, 260);
    //            done();
    //        }).catch(function (err) { fail(err);});;
    //    }).catch(function (err) { fail(err);});
    //});

});
