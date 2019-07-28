import React from 'react';
import ReactDOM from 'react-dom';
import TestUtils from 'react-addons-test-utils';
import ScopeControl from '../ScopeControl';

const factories = require('./factories');

jest.mock('../sheet-rest');
const rest = require('../sheet-rest');

describe('ScopeControl', () => {
    "use strict";

    const getScopeControl = (props) => {
        if (!props) {
            props = {};
        }
        props.scope = factories.scopeFactory(props.scope);
        return TestUtils.renderIntoDocument(<ScopeControl {...props}/>);
    };

    it('renders the scope even without a list', () => {
        rest.getData.mockReturnValue(Promise.resolve([]));
        const control = getScopeControl({scope: {name: 'Skubadoo', sight: 700}});
        expect(ReactDOM.findDOMNode(control).textContent).toContain('Skubadoo');
    });

    it('loads the scope selection on mount', () => {

        let scope = factories.scopeFactory();
        const getPromise = Promise.resolve([scope]);
        rest.getData.mockClear();
        rest.getData.mockReturnValue(getPromise);

        const control = getScopeControl({
            scope: {name: 'Skubadoo', sight: 700},
            url: "/rest/foo"});

        expect(control.state.busy).toBe(true);

        expect(rest.getData).toBeCalledWith('/rest/foo');

        return getPromise.then(() => {
            expect(control.state.busy).toBe(false);
            expect(control.state.scopeChoices).toEqual([scope]);
        });
    });

    it('allows changing the scope', () => {
        let scope = factories.scopeFactory({id: 42});
        let newScope = factories.scopeFactory({id: 12});
        const getPromise = Promise.resolve([
            newScope,
            Object.assign({}, scope), // Ensure distinct, but equal otherwise, object.
            factories.scopeFactory({id: 50})]);

        rest.getData.mockClear();
        rest.getData.mockReturnValue(getPromise);

        let spy = jest.fn();
        let updatePromise = Promise.resolve({});
        spy.mockReturnValue(updatePromise);

        const control = getScopeControl({scope: scope, url: "/rest/foo",
            onChange: spy });

        return getPromise.then(() => {
            control.handleChange(newScope);

            expect(spy).toBeCalledWith(newScope);

            return updatePromise.then(() => {
                expect(control.state.editing).toEqual(false);
            });
        });
    });
});