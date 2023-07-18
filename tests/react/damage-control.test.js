import React from 'react';
import TestUtils from 'react-dom/test-utils';

import DamageControl from 'DamageControl';
const WoundRow = require('WoundRow').default;
import AddWoundControl from 'AddWoundControl';

const factories = require('./factories');

import {fireEvent, render, screen} from '@testing-library/react'
import { rest } from 'msw'
import { setupServer } from 'msw/node'
import userEvent from '@testing-library/user-event'

import {defer} from './testutils'

const server = setupServer(
)

describe('DamageControl', function() {

    var getDamageControlTree = function (givenProps) {
        var props = givenProps;
        if (!props) {
            props = {};
        }
        props.handler = factories.skillHandlerFactory({character: props.character});
        props.character = props.handler.props.character;
        if (props.wounds) {
            props.wounds = props.wounds.map(
                (props) => { return factories.woundFactory(props); });
        }
        return TestUtils.renderIntoDocument(
            <DamageControl {...props} />
        );
    };

    var getDamageControl = function(givenProps) {
        var control = getDamageControlTree(givenProps);
        return TestUtils.findRenderedComponentWithType(control,
            DamageControl);
    };

    const renderDamageControl = (givenProps) => {
        var props = givenProps
        if (!props) {
            props = {}
        }
        props.handler = factories.skillHandlerFactory({character: props.character})
        props.character = props.handler.props.character
        if (props.wounds) {
            props.wounds = props.wounds.map(
                (props) => { return factories.woundFactory(props); })
        }
        return render(<DamageControl {...props} />)
    }


    it("can validate the input field", async () => {
        renderDamageControl()

        const el = await screen.findByLabelText("Stamina damage")

        fireEvent.change(el, {target: {value: "a2"}})

        expect(el).not.toHaveClass("is-valid")

        fireEvent.change(el, {target: {value: "2"}})

        expect(el).toHaveClass("is-valid")
    });

    it('validates input and accepts valid', async ()=> {
        const user = userEvent.setup()
        const spy = jest.fn().mockResolvedValue()

        renderDamageControl({
            onMod: spy,
            character: {cur_ref: 40, cur_wil: 40}
        })

        const el = await screen.findByRole("textbox", {name: "Stamina damage"})

        await user.clear(el)
        await user.type(el, "8")

        expect(el).toHaveClass("is-valid")

        await user.click(screen.getByRole("button", {name: "Change"}))

        expect(spy).toHaveBeenCalledWith('stamina_damage', 0, 8);
    });

    it('validates can be submitted with Enter', async ()=> {
        const user = userEvent.setup()
        const spy = jest.fn().mockResolvedValue()

        renderDamageControl({
            onMod: spy,
            character: {cur_ref: 40, cur_wil: 40}
        })

        const el = await screen.findByRole("textbox", {name: "Stamina damage"})

        await user.clear(el)
        await user.type(el, "8[Enter]")

        expect(spy).toHaveBeenCalledWith('stamina_damage', 0, 8);
    })

    it('can be busy during REST update', function (done) {
        var promise = Promise.resolve({});
        var callback = jasmine.createSpy("callback").and.returnValue(promise);
        var control = getDamageControl({onMod: callback, character:
        {cur_ref:40, cur_wil: 40}});

        TestUtils.Simulate.change(
            control._inputField, {target: {value: 8}});
        expect(control.isValid()).toEqual(true);

        TestUtils.Simulate.click(control._changeButton);

        expect(control.state.isBusy).toEqual(true);
        promise.then(() => {
            expect(control.state.isBusy).toEqual(false);
            done();
        });
    });

    it("allows clearing stamina damage", function () {
        var promise = Promise.resolve({});
        var callback = jasmine.createSpy("callback").and.returnValue(promise);

        var control = getDamageControl({onMod: callback, character:
        {cur_ref:40, cur_wil: 40, stamina_damage: 12}});

        TestUtils.Simulate.click(control._clearButton);

        expect(callback).toHaveBeenCalledWith('stamina_damage', 12, 0);
    });

    it("allows wounds to be passed", async () => {
        renderDamageControl({
            wounds: [{damage: 5, location: "H",
                      id: 2, effect: "Throat punctured."}]
            })

        await screen.findByText("Throat punctured.")
    });

    it("renders multiple wounds", async () => {
        renderDamageControl({
            wounds: [{damage: 5, location: "H",
                      id: 2, effect: "Throat punctured."},
                        {damage: 3, location: "T",
                      id: 2, effect: "Heart racing."}]
            })

        await screen.findByText("Throat punctured.")
        await screen.findByText("Heart racing.")
    });

    it("allows wounds to be added", function () {
        var callback = jasmine.createSpy("callback").and.returnValue(Promise.resolve({}));
        var tree = getDamageControlTree({onWoundAdd: callback});
        var addWoundControl = TestUtils.findRenderedComponentWithType(tree,
            AddWoundControl);

        TestUtils.Simulate.change(addWoundControl._damageInputField,
            {target: {value: 5}});
        addWoundControl.handleEffectChange("Fuzznozzle");

        TestUtils.Simulate.click(addWoundControl._addButton);

        expect(callback).toHaveBeenCalledWith({location: "T",
            damage_type: "S", damage: 5, effect: 'Fuzznozzle'});
    });

    it("allows wounds to be removed", function () {
        var callback = jasmine.createSpy("callback").and.returnValue(Promise.resolve({}));
        var tree = getDamageControlTree({
            wounds: [{id: 2}],
            onWoundRemove: callback
            });
        var woundRow = TestUtils.findRenderedComponentWithType(tree,
            WoundRow);

        TestUtils.Simulate.click(woundRow._removeButton);

        expect(callback).toHaveBeenCalledWith({id:2});

    });

    it("allows wounds to be modified", function () {
        var callback = jasmine.createSpy("callback").and.returnValue(Promise.resolve({}));
        var tree = getDamageControlTree({
            wounds: [{damage: 5, location: "H", healed: 0,
                      id: 2, effect: "Throat punctured."}],
            onWoundMod: callback
            });
        var woundRow = TestUtils.findRenderedComponentWithType(tree,
            WoundRow);

        TestUtils.Simulate.click(woundRow._healButton);

        expect(callback).toHaveBeenCalledWith({id:2, healed: 1});
    });
});
