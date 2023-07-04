import React from 'react';
import ReactDOM from 'react-dom';
import TestUtils from 'react-dom/test-utils';
import AmmoControl from 'AmmoControl';

const factories = require('./factories');

jest.mock('sheet-rest');
const rest = require('sheet-rest');

describe('AmmoControl', () => {
    "use strict";

    const getAmmoControl = (props) => {
        if (!props) {
            props = {};
        }
        props.ammo = factories.ammunitionFactory(props.ammo);
        return  TestUtils.renderIntoDocument(<AmmoControl {...props}/>);
    };

    it('renders the ammo even without a list', () => {
        rest.getData.mockReturnValue(Promise.resolve([]));
        const control = getAmmoControl({ammo: {label: 'Skubadoo', bullet_type: "AP-HP"}});
        expect(ReactDOM.findDOMNode(control).textContent).toContain('Skubadoo');
        expect(ReactDOM.findDOMNode(control).textContent).toContain('AP-HP');
    });

    it('loads the ammo selection on mount', () => {

        let ammo = factories.ammunitionFactory();
        const getPromise = Promise.resolve([ammo]);
        rest.getData.mockClear();
        rest.getData.mockReturnValue(getPromise);

        const control = getAmmoControl({ammo: {label: 'Skubadoo', bullet_type: "AP-HP"},
                                        url: "/rest/foo"});

        expect(control.state.busy).toBe(true);

        expect(rest.getData).toBeCalledWith('/rest/foo');

        return getPromise.then(() => {
            expect(control.state.busy).toBe(false);
            expect(control.state.ammoChoices).toEqual([ammo]);
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

        return getPromise.then(() => {
            control.handleChange(newAmmo);

            expect(spy).toBeCalledWith(newAmmo);

            return updatePromise.then(() => {
                expect(control.state.editing).toEqual(false);
            });
        });
    });
});