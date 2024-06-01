import React from 'react';

import { screen, render, fireEvent, waitFor } from '@testing-library/react'
import { rest } from 'msw'
import { setupServer } from 'msw/node'
import userEvent from '@testing-library/user-event'

import Inventory from 'Inventory';

import * as factories from './factories'

const server = setupServer(
    rest.get('http://localhost/rest/sheets/1/inventory/', (req, res, ctx) => {
        return res(ctx.json([]))
    })
)

describe('Inventory', function() {
    beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
    afterEach(() => server.resetHandlers())
    afterAll(() => server.close())

    const renderInventory = (givenProps) => {
        const props = Object.assign({url: "/rest/sheets/1/inventory/"},
            givenProps)
        return render(<Inventory {...props}/>)
    }

    it('renders also as empty', async () => {
        const inventory = renderInventory()
        await waitFor(() => (expect(screen.queryByLabelText("Loading")).not.toBeInTheDocument()))
    });

    it('loads inventory with a REST API', async ()=> {
        server.use(
            rest.get('http://localhost/rest/sheets/1/inventory/', (req, res, ctx) => {
                return res(ctx.json([
                    factories.inventoryEntryFactory({
                        description: "Collectable comic",
                        unit_weight: 5.50,
                        quantity: 1
                    }),
                    factories.inventoryEntryFactory({
                        description: "Potion of flying",
                        unit_weight: 0.50,
                        quantity: 1
                    })

                ]))
            })
        )
        const inventory = renderInventory()
        await waitFor(() => (expect(screen.queryByLabelText("Loading")).not.toBeInTheDocument()))
        expect(screen.getByText("Collectable comic")).toBeInTheDocument()
        const weights = inventory.getAllByLabelText("Weight")
        expect(weights[0].textContent).toEqual("5.50")
        expect(weights[1].textContent).toEqual("0.50")
    });


    it('allows addition to be canceled', async () => {
        const user = userEvent.setup()

        const inventory = renderInventory()
        await waitFor(() => (expect(screen.queryByLabelText("Loading")).not.toBeInTheDocument()))

        expect(screen.queryByRole("button", {name: "Cancel"})).not.toBeInTheDocument()

        await user.click(inventory.getByRole("button", {name: "Add entry"}))

        expect(inventory.getByRole("button", {name: "Add entry"})).toBeDisabled()

        fireEvent.change(inventory.getByRole("textbox", {name: "description"}), {target: {value: "Foofaa"}})

        expect(inventory.getByRole("button", {name: "Add entry"})).not.toBeDisabled()

        expect(screen.getByDisplayValue("Foofaa")).toBeInTheDocument()

        expect(screen.queryByRole("button", {name: "Cancel"})).toBeInTheDocument()

        await user.click(screen.getByRole("button", {name: "Cancel"}))

        expect(screen.queryByDisplayValue("Foofaa")).not.toBeInTheDocument()
        expect(screen.queryByRole("button", {name: "Cancel"})).not.toBeInTheDocument()
        expect(inventory.getByRole("button", {name: "Add entry"})).not.toBeDisabled()
    });

    it('allows addition to be canceled without data entry', async () => {
        const user = userEvent.setup()

        const inventory = renderInventory()
        await waitFor(() => (expect(screen.queryByLabelText("Loading")).not.toBeInTheDocument()))

        expect(screen.queryByRole("button", {name: "Cancel"})).not.toBeInTheDocument()

        await user.click(inventory.getByRole("button", {name: "Add entry"}))

        expect(inventory.getByRole("button", {name: "Add entry"})).toBeDisabled()

        expect(screen.queryByRole("button", {name: "Cancel"})).toBeInTheDocument()

        await user.click(screen.getByRole("button", {name: "Cancel"}))

        expect(screen.queryByRole("button", {name: "Cancel"})).not.toBeInTheDocument()
        expect(inventory.getByRole("button", {name: "Add entry"})).not.toBeDisabled()
    });

    it('allows addition to be canceled with Escape key', async () => {
        const user = userEvent.setup()

        const inventory = renderInventory()
        await waitFor(() => (expect(screen.queryByLabelText("Loading")).not.toBeInTheDocument()))

        expect(screen.queryByRole("button", {name: "Cancel"})).not.toBeInTheDocument()

        await user.click(inventory.getByRole("button", {name: "Add entry"}))

        expect(inventory.getByRole("button", {name: "Add entry"})).toBeDisabled()

        expect(screen.queryByRole("button", {name: "Cancel"})).toBeInTheDocument()

        inventory.getByRole("textbox", {name: "description"}).focus()

        await user.keyboard("[Escape]")

        expect(inventory.getByRole("button", {name: "Add entry"})).not.toBeDisabled()
        expect(screen.queryByRole("button", {name: "Cancel"})).not.toBeInTheDocument()
    });

    it('allows items to be edited and submitted with Enter', async () => {
        const user = userEvent.setup()
        server.use(
            rest.get('http://localhost/rest/sheets/1/inventory/', (req, res, ctx) => {
                return res(ctx.json([
                    factories.inventoryEntryFactory({
                        id: 97,
                        description: "Collectable comic",
                        unit_weight: 5.50,
                        quantity: 1
                    })
                    ],
                ))
            }),
            rest.put('http://localhost/rest/sheets/1/inventory/97', async (req, res, ctx) => {
                return res(ctx.json(await req.json()))
            }),
        )
        const spy = jest.fn().mockResolvedValue()
        const inventory = renderInventory({onWeightChange: spy})
        await waitFor(() => (expect(screen.queryByLabelText("Loading")).not.toBeInTheDocument()))

        await user.click(inventory.getByText("Collectable comic"))

        fireEvent.change(inventory.getByRole("textbox", {name: "description"}), {target: {value: "Foofaa"}})
        fireEvent.change(inventory.getByRole("textbox", {name: "weight"}), {target: {value: 0.5}})

        await inventory.getByRole("textbox", {name: "weight"}).focus()
        await user.keyboard("[Enter]")

        expect(spy).toHaveBeenCalledWith(0.5)

        expect(screen.queryByText("Foofaa")).toBeInTheDocument()
    });

    it('reports total weight', async ()=> {
        server.use(
            rest.get('http://localhost/rest/sheets/1/inventory/', (req, res, ctx) => {
                return res(ctx.json([
                    factories.inventoryEntryFactory({
                        description: "Collectable comic",
                        unit_weight: 5.50,
                        quantity: 1
                    }),
                    factories.inventoryEntryFactory({
                        description: "Potion of flying",
                        unit_weight: 0.50,
                        quantity: 1
                    })
                ]))
            })
        )

        const spy = jest.fn().mockResolvedValue()
        const inventory = renderInventory({onWeightChange: spy})
        await waitFor(() => (expect(screen.queryByLabelText("Loading")).not.toBeInTheDocument()))

        expect(spy).toHaveBeenCalledWith(6)
    });

    it('reports total weight after removal', async ()=> {
        const user = userEvent.setup()
        server.use(
            rest.get('http://localhost/rest/sheets/1/inventory/', (req, res, ctx) => {
                return res(ctx.json([
                    factories.inventoryEntryFactory({
                        description: "Collectable comic",
                        unit_weight: 5.50,
                        quantity: 1
                    }),
                    factories.inventoryEntryFactory({
                        id: 97,
                        description: "Potion of flying",
                        unit_weight: 0.50,
                        quantity: 1
                    })
                ]))
            }),
            rest.delete('http://localhost/rest/sheets/1/inventory/97/', (req, res, ctx) => {
                return res(ctx.json({}))
            })
        )

        const spy = jest.fn().mockResolvedValue()
        const inventory = renderInventory({onWeightChange: spy})
        await waitFor(() => (expect(screen.queryByLabelText("Loading")).not.toBeInTheDocument()))

        await user.click(inventory.getAllByRole("button", {"name": "Remove"})[1])
        expect(spy).toHaveBeenCalledWith(5.50)
    });

    it('reports total weight after edit and submit with repeated Add entry', async ()=> {
        const user = userEvent.setup()
        server.use(
            rest.get('http://localhost/rest/sheets/1/inventory/', (req, res, ctx) => {
                return res(ctx.json([
                    factories.inventoryEntryFactory({
                        description: "Collectable comic",
                        unit_weight: 5.50,
                        quantity: 1
                    })
                    ],
                ))
            }),
            rest.post('http://localhost/rest/sheets/1/inventory/', async (req, res, ctx) => {
                return res(ctx.json(Object.assign(await req.json(), {id: 99})))
            })
        )
        const spy = jest.fn().mockResolvedValue()
        const inventory = renderInventory({onWeightChange: spy})
        await waitFor(() => (expect(screen.queryByLabelText("Loading")).not.toBeInTheDocument()))

        await user.click(inventory.getByRole("button", {name: "Add entry"}))

        fireEvent.change(inventory.getByRole("textbox", {name: "description"}), {target: {value: "Foofaa"}})
        fireEvent.change(inventory.getByRole("textbox", {name: "weight"}), {target: {value: 0.5}})

        await user.click(inventory.getByRole("button", {name: "Add entry"}))

        expect(spy).toHaveBeenCalledWith(6)
    });
});