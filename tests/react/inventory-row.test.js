import React from 'react';

import InventoryRow from 'InventoryRow';

import { render, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const inventoryEntryFactory = function (overrides) {
    const _entryData = {
        quantity: 1,
        unit_weight: "0.5",
        description: "Inventory item",
        order: 0,
        location: ""
    };

    return Object.assign(_entryData, overrides);
};

const inventoryRowFactory = function(givenProps) {
    const props = {initialEntry: inventoryEntryFactory()};

    return render(
        <table>
            <tbody>
                <InventoryRow {...Object.assign(props, givenProps)}/>
            </tbody>
        </table>)
};

describe('InventoryRow', function() {
    it('renders also as empty', function () {
        const row = inventoryRowFactory()

        row.getByText("Inventory item")
        row.getByRole("button", {name: /Remove/})
    });

    it('validates description field', async () => {
        const user = userEvent.setup()

        const row = inventoryRowFactory()

        await user.click(row.getByText(/Inventory item/))

        let elems = await row.findAllByRole("textbox")

        fireEvent.change(elems[0], {target: {value: ""}})

        elems = await row.findAllByRole("textbox")

        expect(elems[0]).not.toHaveClass("is-valid")

        fireEvent.change(elems[0], {target: {value: "Tsup"}})

        elems = await row.findAllByRole("textbox")
        expect(elems[0]).toHaveClass("is-valid")
    });

    it('allows canceling edit', async () => {
        const spy = jest.fn().mockResolvedValue({})
        const user = userEvent.setup()

        const row = inventoryRowFactory({onMod: spy})

        await user.click(row.getByText(/Inventory item/))

        const elems = await row.findAllByRole("textbox")

        fireEvent.change(elems[0], {target: {value: "Foo faa fom"}})

        await user.keyboard('{Escape}')

        await row.findByText(/Inventory item/)
        await row.findByText("0.5")

        expect(spy).not.toHaveBeenCalled()
    });

    it('validates unit weight field', async () => {
        const user = userEvent.setup()

        const row = inventoryRowFactory()

        await user.click(row.getByText("0.5"))

        const el = await row.findByLabelText("weight");
        await user.click(el)

        fireEvent.change(el, {target: {value: "Foo faa fom"}})

        expect(row.getByLabelText("weight")).not.toHaveClass('is-valid')

        fireEvent.change(el, {target: {value: "2.1"}})

        expect(row.getByLabelText("weight")).toHaveClass('is-valid')
    });

    it('validates quantity field', async () => {
        const user = userEvent.setup()

        const row = inventoryRowFactory()

        await user.click(row.getByText("0.5"))

        const el = await row.findByLabelText("quantity");
        await user.click(el)

        fireEvent.change(el, {target: {value: "a2"}})

        expect(row.getByLabelText("quantity")).not.toHaveClass('is-valid')

        fireEvent.change(el, {target: {value: "2"}})

        expect(row.getByLabelText("quantity")).toHaveClass('is-valid')
    });

    it('allows edit of location field', async () => {
        const user = userEvent.setup()

        const row = inventoryRowFactory()

        await user.click(row.getByText("Inventory item"))

        const el = await row.findByLabelText("location");
        await user.click(el)

        fireEvent.change(el, {target: {value: "Head"}})

        expect(row.getByLabelText("location")).toHaveClass('is-valid')

        fireEvent.change(el, {target: {value: ""}})

        expect(row.getByLabelText("location")).toHaveClass('is-valid')

        fireEvent.change(el, {target: {value: "Foot"}})
    });

    it('calls onDelete on clicking remove', async () => {
        const user = userEvent.setup()

        const spy = jest.fn().mockResolvedValue({})
        const row = inventoryRowFactory({onDelete: spy});

        const el = await row.findByRole("button", {name: "Remove"})

        await user.click(el)

        expect(spy).toHaveBeenCalledWith();
    });

    it('handles submit', async () => {
        const spy = jest.fn().mockResolvedValue({})
        const user = userEvent.setup()

        const entry = inventoryEntryFactory();
        const row = inventoryRowFactory({
            initialEntry: entry,
            onMod: spy})

        await user.click(row.getByText(/Inventory item/))

        const descrEl = await row.findByLabelText("description")

        fireEvent.change(descrEl, {target: {value: "Foo faa fom"}})

        const locEl = await row.findByLabelText("location")

        fireEvent.change(locEl, {target: {value: "Foot"}})

        const quantityEl = await row.findByLabelText("quantity")

        fireEvent.change(quantityEl, {target: {value: "10"}})

        await user.keyboard('{Enter}')

        expect(spy).toHaveBeenCalledTimes(1)
        expect(spy).toHaveBeenCalledWith(Object.assign(entry, {description: "Foo faa fom",
        location: "Foot", quantity: "10"}))

        expect(await row.queryAllByRole("textbox").length).toBe(0)
    });

    it('disables submit on invalid input', async () => {
        const spy = jest.fn().mockResolvedValue({})
        const user = userEvent.setup()

        const entry = inventoryEntryFactory();
        const row = inventoryRowFactory({
            initialEntry: entry,
            onMod: spy})

        await user.click(row.getByText(/Inventory item/))

        const el = await row.findByLabelText("weight")

        fireEvent.change(el, {target: {value: "a2.1"}})

        await user.keyboard('{Enter}')

        expect(spy).not.toHaveBeenCalled()
    });

    it ('enables all fields when creating new entry', async () => {
        const row = inventoryRowFactory({createNew: true})
        const elems = await row.findAllByRole("textbox")
        expect(elems.length).toEqual(4)
    });

    it ('allows submit on creating new entry', async () => {
        const spy = jest.fn().mockResolvedValue({})
        const user = userEvent.setup()

        const row = inventoryRowFactory({
            initialEntry: undefined,
            createNew: true,
            onMod: spy
        });

        const el = row.getByLabelText("description")

        fireEvent.change(el, {target: {value: "Foobar"}})

        await user.keyboard('{Enter}')

        expect(spy).toHaveBeenCalledWith({description: "Foobar",
             quantity: "1",
             unit_weight: "1.0",
             location: ""
         });
    });
});