import React from 'react';
import CharacterNotes from 'CharacterNotes';

import {
    render,
    screen,
    waitFor,
    waitForElementToBeRemoved
} from '@testing-library/react'
import {rest} from 'msw'
import {setupServer} from 'msw/node'
import userEvent from '@testing-library/user-event'

import * as factories from './factories'

const server = setupServer(
  rest.get('http://localhost/rest/characters/42', (req, res, ctx) => {
    return res(ctx.json(factories.characterFactory({notes: "this is char pk 42 notes"})))
  }),
)


describe('character note tests', function (){
    beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
    afterEach(() => server.resetHandlers())
    afterAll(() => server.close())

    it('can change to editing mode by clicking the text area', async function () {
        const user = userEvent.setup()

        render(<CharacterNotes url="/rest/characters/42" />)
        await waitForElementToBeRemoved(document.querySelector("#loading"))

        expect(screen.getByRole("textbox")).toHaveAttribute('readonly')

        await user.click(screen.getByRole("textbox"))

        expect(screen.getByRole("textbox")).not.toHaveAttribute('readonly')

    });

    it('reverts value on cancel', async function () {
        const user = userEvent.setup()

        render(<CharacterNotes url="/rest/characters/42" />)
        await waitForElementToBeRemoved(document.querySelector("#loading"))

        await user.click(screen.getByRole("button", {name: "Edit"}))

        expect(screen.getByRole("textbox")).not.toHaveAttribute('readonly')

        await user.clear(screen.getByRole("textbox"))
        await user.type(screen.getByRole("textbox"), "This is the new note")

        await user.click(screen.getByRole("button", {name: "Cancel"}))

        expect(screen.queryByRole("button", {name: "Update"})).toBe(null)

        expect(screen.queryByText("This is the new note")).toBe(null)

        expect(screen.queryByText("this is char pk 42 notes")).toBeInTheDocument()
    });


    it('obtains initial data with fetch',  async function () {
        const notes = render(<CharacterNotes url="/rest/characters/42" />)
        await waitForElementToBeRemoved(document.querySelector("#loading"))

        expect(screen.queryByText("this is char pk 42 notes")).toBeInTheDocument()
    });

    it('updates state to the server', async function () {
        const user = userEvent.setup()

        render(<CharacterNotes url="/rest/characters/42" />)
        await waitForElementToBeRemoved(document.querySelector("#loading"))

        expect(screen.queryByText("this is char pk 42 notes")).toBeInTheDocument()

        expect(screen.getByRole("textbox")).toHaveAttribute('readonly')

        await user.click(screen.getByRole("button", {name: "Edit"}))

        expect(screen.getByRole("textbox")).not.toHaveAttribute('readonly')

        await user.clear(screen.getByRole("textbox"))
        await user.type(screen.getByRole("textbox"), "This is the new note")

        server.use(
            rest.patch("http://localhost/rest/characters/42", async (req, res, ctx) => {
                return res(ctx.json(
                    await req.json()
                ))
            }),
        )

        await user.click(screen.getByRole("button", {name: "Update"}))

        await waitFor(() => expect(screen.queryByRole("button", {name: "Update"})).toBe(null))
    });
});

