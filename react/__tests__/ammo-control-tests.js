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

    it('on pressing change, it loads the ammo selection', () => {
        const getPromise = Promise.resolve([]);
        rest.getData.mockClear();
        rest.getData.mockReturnValue(getPromise);

        const control = getAmmoControl({ammo: {label: 'Skubadoo', bullet_type: "AP-HP",
                                        url: "/rest/foo"}});

        // expect(control._changeAmmoButton).toBeDefined();

        return getPromise.then(() => {
            console.log("Promise resolved");
            // fail("foo?");
        });
    });

    xit('on pressing change, preselects current ammo', () => {

    });

    xit('allows canceling change with esc', () => {

    });

    xit('allows changing the ammo', () => {

    });

});