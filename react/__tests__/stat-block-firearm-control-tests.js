import TestUtils from 'react-dom/test-utils';
import AmmoControl from '../AmmoControl';
import ScopeControl from '../ScopeControl';
import FirearmControl from '../FirearmControl';

const factories = require('./factories');

jest.mock('../sheet-rest');
const rest = require('../sheet-rest');

describe('StatBlock -- FirearmControl', () => {
    "use strict";

    // TODO: fairly hard to verify REST API call payloads. Try to make this simpler.
    it('allows changing a firearm', () => {
        // Check that changing the firearm gets propagated up, and REST API is
        // invoked.
        const block = factories.statBlockFactory({firearms: [{id: 5, ammo: {id: 12}, scope: null}]});

        return block.loaded.then(() => {
            let ammoControl = TestUtils.findRenderedComponentWithType(block, AmmoControl);

            let ammoPatchResolve = Promise.resolve({});
            rest.patch.mockReturnValue(ammoPatchResolve);

            expect(ammoControl.props.ammo.id).toEqual(12);
            let newAmmo = factories.ammunitionFactory({id: 42, label: "Foo"});
            ammoControl.handleChange(newAmmo);

            expect(rest.patch).toBeCalledWith('/rest/sheets/1/sheetfirearms/5/', {id: 5, ammo: 42});

            rest.patch.mockClear();
            let scopePatchResolve = Promise.resolve({});
            rest.patch.mockReturnValue(scopePatchResolve);

            let scopeControl = TestUtils.findRenderedComponentWithType(block, ScopeControl);
            expect(scopeControl.props.scope).toBe(null);
            let newScope = factories.scopeFactory({id: 42, name: "Baff baff"});
            scopeControl.handleChange(newScope);
            expect(rest.patch).toBeCalledWith('/rest/sheets/1/sheetfirearms/5/', {id: 5, scope: 42});

            return Promise.all([ammoPatchResolve, scopePatchResolve]).then((values) => {
                expect(block.state.firearmList[0].ammo).toEqual(newAmmo);
                expect(block.state.firearmList[0].scope).toEqual(newScope);
            });

        });
    });

    it('allows removing a scope from a firearm', () => {
        // Check that changing the firearm gets propagated up, and REST API is
        // invoked.
        const block = factories.statBlockFactory({
            firearms: [{
                id: 5,
                ammo: {id: 12},
                scope: {id: 42}
            }]
        });

        return block.loaded.then(() => {
            rest.patch.mockClear();
            let scopePatchRemoveResolve = Promise.resolve({});
            rest.patch.mockReturnValue(scopePatchRemoveResolve);

            let scopeControl = TestUtils.findRenderedComponentWithType(block, ScopeControl);
            expect(scopeControl.props.scope).not.toBe(null);

            let fireArmControl = TestUtils.findRenderedComponentWithType(block, FirearmControl);
            fireArmControl.handleScopeRemove()
            expect(rest.patch).toBeCalledWith('/rest/sheets/1/sheetfirearms/5/', {id: 5, scope: null});

            return scopePatchRemoveResolve.then(() => {
                expect(block.state.firearmList[0].scope).toEqual(null);
            });

        });
    });
});
