import {ScopeControl} from 'ScopeControl';
import ReactDOM from 'react-dom';
import TestUtils from 'react-dom/test-utils';

const factories = require('./factories');

describe('FirearmControl -- ScopeControl', () => {
    "use strict";

    it('renders ScopeControl', () => {
        const control = factories.firearmControlTreeFactory({weapon:
            {scope: {name: "Test Scope"}}});
        let scopeControl = TestUtils.findRenderedComponentWithType(
            control, ScopeControl);
        expect(scopeControl).toBeDefined();
        expect(ReactDOM.findDOMNode(scopeControl).textContent).toContain("Test Scope");
    });

    it('does not barf without a scope', () => {
        const control = factories.firearmControlTreeFactory({weapon:
            {scope: null}});
        let scopeControl = TestUtils.findRenderedComponentWithType(
            control, ScopeControl);
        expect(scopeControl).toBeDefined();
        expect(ReactDOM.findDOMNode(scopeControl).textContent).toEqual("");
    });

    it('shows a disabled remove button without a scope', () => {
        const control = factories.firearmControlTreeFactory({weapon:
            {scope: null}});
        expect(ReactDOM.findDOMNode(control._scopeRemoveButton).disabled).toBe(true);
    });

    it('integrates scopeControl for listing URL', () => {
        // Check that url for firearm gets propagated correctly.
        const control = factories.firearmControlTreeFactory({weapon:
            {base: {name: "Nabu tussari"},
             scope: {name: "Test scope"}},
        campaign: 4});
        let scopeControl = TestUtils.findRenderedComponentWithType(
            control, ScopeControl);
        expect(scopeControl.props.url).toEqual('/rest/scopes/campaign/4/');
    });

    it('integrates ScopeControl for changing scope', () => {
        const spy = jest.fn().mockReturnValue(Promise.resolve({}));

        const control = factories.firearmControlTreeFactory({weapon:
            {id: 19,
                base: {name: "Nabu tussari"},
                scope: {"label": "Test scope"}},
            onChange: spy
        });
        let scopeControl = TestUtils.findRenderedComponentWithType(
            control, ScopeControl);

        let newScope = factories.ammunitionFactory({id: 56});
        scopeControl.handleChange(newScope);

        expect(spy).toBeCalledWith({id: 19, scope: newScope});
    });

    it('allows removing scope', () => {
        const spy = jest.fn().mockReturnValue(Promise.resolve({}));

        const control = factories.firearmControlTreeFactory({weapon:
            {id: 19,
                base: {name: "Nabu tussari"},
                scope: {name: "Test scope"}},
            onChange: spy
        });
        TestUtils.Simulate.click(ReactDOM.findDOMNode(control._scopeRemoveButton));
        expect(spy).toBeCalledWith({id: 19, scope: null});
    });

});
