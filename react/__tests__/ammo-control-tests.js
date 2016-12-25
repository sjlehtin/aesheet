import React from 'react';
import ReactDOM from 'react-dom';
import TestUtils from 'react-addons-test-utils';
import AmmoControl from '../AmmoControl';

const factories = require('./factories');

jest.mock('../sheet-rest');
const rest = require('../sheet-rest');

describe('AmmoControl', () => {
    "use strict";

    const getAmmoControl = (props) => {
        if (!props) {
            props = {};
        }
        props.ammo = factories.ammunitionFactory(props.ammo);
        return  TestUtils.renderIntoDocument(<AmmoControl {...props}/>);
    };

    it('renders the ammo when not editing', () => {
        const control = getAmmoControl({ammo: {label: 'Skubadoo', bullet_type: "AP-HP"}});
        expect(ReactDOM.findDOMNode(control).textContent).toContain('Skubadoo');
        expect(ReactDOM.findDOMNode(control).textContent).toContain('AP-HP');
    });

    it('contains a change button', () => {
        const control = getAmmoControl({ammo: {label: 'Skubadoo', bullet_type: "AP-HP"},
                                        url: "/rest/foo"});
        expect(control._changeButton).toBeDefined();
    });

    it('on pressing change, it loads the ammo selection', () => {

        let ammo = factories.ammunitionFactory();
        const getPromise = Promise.resolve([ammo]);
        rest.getData.mockClear();
        rest.getData.mockReturnValue(getPromise);

        const control = getAmmoControl({ammo: {label: 'Skubadoo', bullet_type: "AP-HP"},
                                        url: "/rest/foo"});

        expect(control._changeButton).toBeDefined();

        TestUtils.Simulate.click(ReactDOM.findDOMNode(control._changeButton));

        expect(control.state.editing).toBe(true);
        expect(control.state.busy).toBe(true);

        expect(rest.getData).toBeCalledWith('/rest/foo');

        return getPromise.then(() => {
            expect(control.state.busy).toBe(false);
            expect(control.state.ammoChoices).toEqual([ammo]);
        });
    });

    it('on pressing change, preselects current ammo', () => {
        let ammo = factories.ammunitionFactory({id: 42});
        const getPromise = Promise.resolve([
            factories.ammunitionFactory({id: 12}),
            Object.assign({}, ammo), // Ensure distinct, but equal otherwise, object.
            factories.ammunitionFactory({id: 50})]);
        rest.getData.mockClear();
        rest.getData.mockReturnValue(getPromise);

        const control = getAmmoControl({ammo: ammo, url: "/rest/foo"});

        TestUtils.Simulate.click(ReactDOM.findDOMNode(control._changeButton));

        return getPromise.then(() => {
            expect(control.state.selectedAmmo).toEqual(ammo);
        });

    });

    it('allows canceling change with esc', () => {
        const control = getAmmoControl();

        TestUtils.Simulate.click(ReactDOM.findDOMNode(control._changeButton));

        expect(control.state.editing).toBe(true);

        TestUtils.Simulate.keyDown(
            ReactDOM.findDOMNode(control),
            {key: "Esc", keyCode: 27, which: 27});
        expect(control.state.editing).toBe(false);
    });

    it('on canceling edit, clears previously selected ammo', () => {
        let ammo = factories.ammunitionFactory({id: 42});
        let newAmmo = factories.ammunitionFactory({id: 12});
        const getPromise = Promise.resolve([
            newAmmo,
            Object.assign({}, ammo), // Ensure distinct, but equal otherwise, object.
            factories.ammunitionFactory({id: 50})]);

        rest.getData.mockClear();
        rest.getData.mockReturnValue(getPromise);

        const control = getAmmoControl({ammo: ammo, url: "/rest/foo"});

        TestUtils.Simulate.click(ReactDOM.findDOMNode(control._changeButton));

        return getPromise.then(() => {
            control.handleChange(newAmmo);

            TestUtils.Simulate.keyDown(
                ReactDOM.findDOMNode(control),
                {key: "Esc", keyCode: 27, which: 27});
            expect(control.state.selectedAmmo).not.toBeDefined();
        });
    });

    it('allows changing the ammo', () => {
        let ammo = factories.ammunitionFactory({id: 42});
        let newAmmo = factories.ammunitionFactory({id: 12});
        const getPromise = Promise.resolve([
            newAmmo,
            Object.assign({}, ammo), // Ensure distinct, but equal otherwise, object.
            factories.ammunitionFactory({id: 50})]);

        rest.getData.mockClear();
        rest.getData.mockReturnValue(getPromise);

        let spy = jest.fn();
        let updatePromise = Promise.resolve({});
        spy.mockReturnValue(updatePromise);

        const control = getAmmoControl({ammo: ammo, url: "/rest/foo",
            onChange: spy });

        TestUtils.Simulate.click(ReactDOM.findDOMNode(control._changeButton));

        return getPromise.then(() => {
            expect(control.state.selectedAmmo).toEqual(ammo);

            control.handleChange(newAmmo);

            TestUtils.Simulate.click(ReactDOM.findDOMNode(control._submitButton));

            expect(spy).toBeCalledWith(newAmmo);

            return updatePromise.then(() => {
                expect(control.state.editing).toEqual(false);
            });
        });
    });

});