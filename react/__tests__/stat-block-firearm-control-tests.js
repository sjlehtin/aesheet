import TestUtils from 'react-addons-test-utils';
import AmmoControl from '../AmmoControl';

const factories = require('./factories');

jest.mock('../sheet-rest');
const rest = require('../sheet-rest');

describe('StatBlock -- AmmoControl', () => {
    "use strict";

    it('allows changing a firearm', () => {
        // Check that changing the firearm gets propagated up, and REST API is
        // invoked.
        const block = factories.statBlockFactory({firearms: [{id: 5, ammo: {id: 12}}]});

        return block.loaded.then(() => {
            let ammoControl = TestUtils.findRenderedComponentWithType(block, AmmoControl);

            let patchResolve = Promise.resolve({});
            rest.patch.mockReturnValue(patchResolve);

            expect(ammoControl.props.ammo.id).toEqual(12);
            let newValue = factories.ammunitionFactory({id: 42, label: "Foo"});
            ammoControl.handleChange(newValue);

            expect(rest.patch).toBeCalledWith('/rest/sheets/1/sheetfirearms/5/', {id: 5, ammo: 42});
            return patchResolve.then(() => {
                expect(block.state.firearmList[0].ammo).toEqual(newValue);
            });
        });
    });
});
