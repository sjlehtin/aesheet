import React from 'react';

import StatRow from 'StatRow'

import * as factories from './factories'

import {render, screen} from '@testing-library/react'
import { rest } from 'msw'
import { setupServer } from 'msw/node'
import userEvent from '@testing-library/user-event'

const server = setupServer(
)

const renderStatRow = function(givenProps) {
    var props = {
        stat: "fit",
        url: "/rest/characters/1/",
        initialChar: factories.characterFactory({
            start_fit: 50,
            cur_fit: 55,
            base_mod_fit: -2
        })
    };
    if (typeof(givenProps) !== "undefined") {
        props = Object.assign(props, givenProps);
    }
    var handler = factories.skillHandlerFactory({character: props.initialChar,
        edges: [],
        effects: [{fit: 20}]});
    props.effStats = handler.getEffStats();
    props.baseStats = handler.getBaseStats();

    return render(<table><tbody><StatRow {...props} /></tbody></table>)
};

describe('stat row', function() {
    beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
    afterEach(() => server.resetHandlers())
    afterAll(() => server.close())

    it('calls parent component set change callback', async function () {
        const user = userEvent.setup()
        const spy = jest.fn().mockResolvedValue({})

        renderStatRow({onMod: spy});

        const statElem = screen.getByLabelText("Current FIT")
        expect(statElem.textContent).toEqual("73")

        // Touching the row should cause the edit buttons to be visible.
        await user.pointer([
          // touch the screen at element1
          {keys: '[TouchA>]', target: statElem},
          // release the touch pointer at the last position (element2)
          {keys: '[/TouchA]'},
        ])

        let values = []

        server.use(
            rest.patch('http://localhost/rest/characters/1/', async (req, res, ctx) => {
                const json = await req.json();
                values.push(json)
                return res(ctx.json(json))
            }),
        )

        await user.click(screen.getByRole("button", {name: "Decrease FIT"}))

        expect(spy).toHaveBeenCalledWith("fit", 55, 54)
        expect(values[0].cur_fit).toEqual(54)

        await user.click(screen.getByRole("button", {name: "Increase FIT"}))

        expect(spy).toHaveBeenCalledWith("fit", 54, 55)
        expect(values[1].cur_fit).toEqual(55)
    });
});