import React from 'react';
import { screen, render, waitFor } from '@testing-library/react'
const factories = require('./factories');

import EdgeRow from "EdgeRow"
import userEvent from "@testing-library/user-event";

const edgeRowFactory = function(givenProps) {
    let props = Object.assign(givenProps, {edge:  factories.characterEdgeFactory(givenProps.edge)})
    return render(<table><tbody><EdgeRow {...props} /></tbody></table>)
};

describe('EdgeRow', function() {

    it("can toggle the ignore_cost field", async function () {
        const user = userEvent.setup()

        const spy = jest.fn();

        const edge = factories.characterEdgeFactory({edge: {edge: {name: "Foo edge"}}, level: 2, id: 42});

        edgeRowFactory({
            edge: edge,
            onChange: spy
        });

        const checkbox = screen.getByRole("checkbox", {name: "Ignore cost"})
        expect(checkbox).not.toBeChecked()

        await user.click(checkbox)

        expect(spy.mock.lastCall[0].ignore_cost).toBe(true)

        waitFor(() => {
            expect(screen.getByRole("checkbox", {name: "Ignore cost"})).toBeChecked()
        })
    });

    it("can remove the edge", async function () {
        const user = userEvent.setup()

        const spy = jest.fn();

        const edge = factories.characterEdgeFactory({edge: {edge: {name: "Foo edge"}}, level: 2, id: 42});

        edgeRowFactory({
            edge: edge,
            onRemove: spy
        });

        await user.click(screen.getByRole("button", {name: "Remove"}))

        expect(spy.mock.lastCall[0].id).toBe(42)
    });
});