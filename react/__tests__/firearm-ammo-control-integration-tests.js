import {AmmoControl} from '../AmmoControl';
import ReactDOM from 'react-dom';
import TestUtils from 'react-addons-test-utils';

const factories = require('./factories');

describe('FirearmControl -- AmmoControl', () => {
    "use strict";

    it('renders AmmoControl', () => {
        const control = factories.firearmControlTreeFactory({weapon:
            {ammo: {label: "Test Ammo"}}});
        let ammoControl = TestUtils.findRenderedComponentWithType(
            control, AmmoControl);
        expect(ammoControl).toBeDefined();
        expect(ReactDOM.findDOMNode(ammoControl).textContent).toContain("Test Ammo");
    });

    it('integrates AmmoControl', () => {
        // Check that url for firearm gets propagated correctly.
        const control = factories.firearmControlTreeFactory({weapon:
            {base: {name: "Nabu tussari"},
             ammo: {"label": "Test Ammo"}}});
        let ammoControl = TestUtils.findRenderedComponentWithType(
            control, AmmoControl);
        expect(ammoControl.props.url).toEqual('/rest/ammunition/firearm/Nabu%20tussari/');
    });
});
