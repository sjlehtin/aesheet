import React from 'react';

import StatBlock from 'StatBlock'

import {
    render,
    waitForElementToBeRemoved,
    within,
    fireEvent,
    waitFor,
    screen
} from '@testing-library/react'
import { rest } from 'msw'
import { setupServer } from 'msw/node'
import userEvent from '@testing-library/user-event'

import * as factories from './factories'
import {testSetup} from "./testutils";

const server = setupServer(
  rest.get('http://localhost/rest/sheets/1/', (req, res, ctx) => {
    return res(ctx.json(factories.sheetFactory()))
  }),
  rest.get('http://localhost/rest/sheets/1/*/', (req, res, ctx) => {
    return res(ctx.json([]))
  }),
  rest.get('http://localhost/rest/characters/2/', (req, res, ctx) => {
    return res(ctx.json(factories.characterFactory()))
  }),
  rest.get('http://localhost/rest/characters/2/*/', (req, res, ctx) => {
    return res(ctx.json([]))
  }),
    rest.get('http://localhost/rest/*/campaign/2/', (req, res, ctx) => {
        return res(ctx.json([]))
    }),
    rest.get("http://localhost/rest/ammunition/firearm/The%20Cannon/", (req, res, ctx) => {
        return res(ctx.json([
            factories.ammunitionFactory({id: 97, calibre: {name: "12FR"}}),
            factories.ammunitionFactory({
                id: 42,
                calibre: {name: "FooAmmo"},
                num_dice: 3,
                dice: 4,
                extra_damage: 3,
                leth: 4,
                plus_leth: 2
            }),
        ]))
    }),
)

async function setRangeAndDarknessDL(user, range, darkness) {
  await user.click(screen.getByRole("button", { name: "Combat transients" }));
  const input = await screen.findByLabelText("Range");
  await user.type(input, range);
  const dlInput = screen.getByRole("combobox", { name: "Darkness DL" });
  await user.selectOptions(dlInput, [darkness]);
}

describe('StatBlock -- FirearmControl', () => {
    beforeAll(() => {
        testSetup()
        server.listen({ onUnhandledRequest: 'error' })
    })
    afterEach(() => server.resetHandlers())
    afterAll(() => server.close())

    it ("allows adding a firearm", async () => {
        const user = userEvent.setup()
        const baseFirearm = factories.baseFirearmFactory({id: 43, name: "The Cannon"});

        server.use(
            rest.get("http://localhost/rest/firearms/campaign/2/", (req, res, ctx) => {
                return res(ctx.json([
                    baseFirearm
                ]))
            }),
            rest.post("http://localhost/rest/sheets/1/sheetfirearms/", async (req, res, ctx) => {
                const json = await req.json()
                expect(json.base).toEqual(43)
                expect(json.ammo).toEqual(42)
                return res(ctx.json([
                    baseFirearm
                ]))
            })
        )

        render(<StatBlock url="/rest/sheets/1/" />)
        await waitForElementToBeRemoved(() => screen.queryAllByRole("status", {"busy": true}), {timeout: 5000})

        expect(await screen.queryByLabelText(/Firearm The Cannon/)).not.toBeInTheDocument()

        const firearmInput = await screen.findByRole("combobox", {name: "Firearm"})
        await user.click(firearmInput)

        await user.click(screen.getByText(/The Cannon/))

        const input = await screen.findByRole("combobox", {name: "Ammo"})
        await user.click(input)

        await user.click(screen.getByText(/FooAmmo/))

        await user.click(screen.getByRole("button", {name: "Add Firearm"}))

        expect(await screen.findByLabelText(/Firearm The Cannon/)).toBeInTheDocument()
        expect(screen.getAllByLabelText(/Use type/)[1].textContent).toEqual("FULL")
    })

    test.todo('verify that an existing firearm loaded from the sheet data behaves identically to one that has been just added')
    test.todo('verify shoot button expends ammo')
    test.todo('verify you can shoot a sweep')
    test.todo('verify you can shoot a short burst')
    test.todo('verify you can set the current ammo in a clip') // Add an edit control when hovering over clip data

    it('allows changing a firearm', async () => {
        const user = userEvent.setup()
        const firearm = factories.firearmFactory({'id': 42, 'base': {name: "The Cannon"}});

        server.use(
            rest.get("http://localhost/rest/sheets/1/sheetfirearms/", (req, res, ctx) => {
                return res(ctx.json([
                    firearm
                ]))
            }),
            rest.patch("http://localhost/rest/sheets/1/sheetfirearms/42/", (req, res, ctx) => {
                return res(ctx.json(
                    Object.assign({}, firearm, req)
                ))
            }),

            rest.get("http://localhost/rest/scopes/campaign/2/", (req, res, ctx) => {
                return res(ctx.json([
                    factories.scopeFactory({id: 42, name: "Baff baff", notes: "Awesome scope"}),
                ]))
            }),
        )

        render(<StatBlock url="/rest/sheets/1/" />)
        await waitForElementToBeRemoved(() => screen.queryAllByRole("status", {"busy": true}), {timeout: 5000})

        expect(await screen.findByText("The Cannon")).toBeInTheDocument()

        const input = await screen.findByRole("combobox", {name: "Select ammunition"})
        await user.click(input)

        await user.click(screen.getByText(/FooAmmo/))

        await waitFor(async () => expect((within(await screen.findByLabelText(/Firearm The Cannon/)).queryByLabelText("Damage"))?.textContent).toEqual("3d4+3/4 (+2)"))

        const scopeInput = await screen.findByRole("combobox", {name: "Scope selection"})
        await user.click(scopeInput)

        await user.click(await screen.findByText(/Baff baff/))

        await within(await screen.findByLabelText(/Firearm The Cannon/)).findByText("Awesome scope")
    });

    it('allows changing range to shoot to', async () => {
        const user = userEvent.setup()

        server.use(
            rest.get("http://localhost/rest/sheets/1/sheetfirearms/", (req, res, ctx) => {
                return res(ctx.json([]))
            }),
        )

        const sheet = render(<StatBlock url="/rest/sheets/1/"/>)

        await waitForElementToBeRemoved(document.querySelector("#loading"), {timeout: 5000})

        await setRangeAndDarknessDL(user, "50", "Artificial light (-2)");

        expect(
          (await screen.findByLabelText("Vision check")).textContent,
        ).toEqual("43");
        expect((await screen.findByLabelText("Vision check detail")).textContent).toEqual("Ranged penalty: 2")
    });

    it('verify scope can offset darkness penalty', async () => {
        const user = userEvent.setup()

        const firearm = factories.firearmFactory({'id': 42, 'base': {name: "The Cannon"}})
        const scope = factories.scopeFactory({id: 42, name: "Baff baff", perks: [{edge: "Acute Vision", level: 1}, {edge: "Night Vision", level: 2}], notes: "Awesome scope"})

        server.use(
            rest.get("http://localhost/rest/sheets/1/sheetfirearms/", (req, res, ctx) => {
                return res(ctx.json([
                    firearm
                ]))
            }),
            rest.patch("http://localhost/rest/sheets/1/sheetfirearms/42/", (req, res, ctx) => {
                return res(ctx.json(
                    Object.assign({}, firearm, req)
                ))
            }),

            rest.get("http://localhost/rest/scopes/campaign/2/", (req, res, ctx) => {
                return res(ctx.json([
                    scope,
                ]))
            }),
        )

        const sheet = render(<StatBlock url="/rest/sheets/1/"/>)

        await waitForElementToBeRemoved(document.querySelector("#loading"), {timeout: 5000})

        await setRangeAndDarknessDL(user, "50", "Artificial light (-2)");

        // Verify that darkness penalty gets countered by the scope.
        expect(within(await screen.findByLabelText(/Range effect/)).getByLabelText("Vision check").textContent).toEqual("43")

        const scopeInput = await screen.findByRole("combobox", {name: "Scope selection"})
        await user.click(scopeInput)

        await user.click(await screen.findByText(/Baff baff/))

        await within(await screen.findByLabelText(/Firearm The Cannon/)).findByText("Awesome scope")
        expect(within(await screen.findByLabelText(/Range effect/)).getByLabelText("Vision check").textContent).toEqual("83")
    });


    it('allows removing a scope from a firearm', async () => {
        const user = userEvent.setup()
        const firearm = factories.firearmFactory({
            id: 1,
            'base': {name: "The Cannon"},
            scope: factories.scopeFactory({name: "Awesome scope", id: 42})
        });

        server.use(
            rest.get("http://localhost/rest/sheets/1/sheetfirearms/", (req, res, ctx) => {
                return res(ctx.json([
                    firearm
                ]))
            }),
            rest.patch("http://localhost/rest/sheets/1/sheetfirearms/1/", (req, res, ctx) => {
                return res(ctx.json(
                    Object.assign({}, firearm, req)
                ))
            }),

            rest.get("http://localhost/rest/scopes/campaign/2/", (req, res, ctx) => {
                return res(ctx.json([
                    factories.scopeFactory({id: 42, name: "Baff baff", notes: "Awesome scope"}),
                ]))
            }),
        )

        const sheet = render(<StatBlock url="/rest/sheets/1/" />)
        await waitForElementToBeRemoved(document.querySelector("#loading"), {timeout: 5000})

        const firearmBlock = await sheet.findByLabelText(/Firearm The Cannon/);
        expect(await within(firearmBlock).findByText("Awesome scope")).toBeInTheDocument()
        const scopeSelector = within(firearmBlock).getByRole("combobox", {name: "Scope selection"})
        await user.click(scopeSelector);

        await user.click(await screen.findByText('Remove scope', {}));

        await waitFor(() => expect(within(firearmBlock).queryByText("Awesome scope")).toBeNull())
    });

    it('allows removing a clip from a firearm', async () => {
        const user = userEvent.setup()
        const firearm = factories.firearmFactory({
            id: 1,
            base: {name: "The Cannon"},
            scope: factories.scopeFactory({name: "Awesome scope", id: 42}),
            magazines: [
                factories.magazineFactory({id: 42, capacity: 20, current: 15}),
                factories.magazineFactory({id: 43, capacity: 20, current: 20}),
                factories.magazineFactory({id: 45, capacity: 20, current: 19}),
            ]
        });

        server.use(
            rest.get("http://localhost/rest/sheets/1/sheetfirearms/", (req, res, ctx) => {
                return res(ctx.json([
                    firearm
                ]))
            }),
            rest.get("http://localhost/rest/ammunition/firearm/The%20Cannon/", (req, res, ctx) => {
                return res(ctx.json([
                    factories.ammunitionFactory({id: 97, calibre: {name: "12FR"}}),
                    factories.ammunitionFactory({id: 42, calibre: {name: "FooAmmo"}, num_dice: 3, dice: 4, extra_damage: 3, leth: 4, plus_leth: 2}),
                ]))
            }),
            rest.delete("http://localhost/rest/sheets/1/sheetfirearms/1/magazines/45/", (req, res, ctx) => {
                return res(ctx.json(
                    Object.assign({}, firearm, req)
                ))
            }),

        )

        const sheet = render(<StatBlock url="/rest/sheets/1/" />)
        await waitForElementToBeRemoved(document.querySelector("#loading"), {timeout: 5000})

        const mag = await sheet.queryByLabelText("Magazine of size 20 with 19 bullets remaining")
        expect(mag).not.toBeNull()

        const firearmBlock = await sheet.findByLabelText(/Firearm The Cannon/);
        const removeButtons = await within(firearmBlock).findAllByRole("button", {name: "Remove magazine"})
        expect(removeButtons.length).toEqual(3)

        await user.click(removeButtons[2])

        await waitFor( () => {
            expect(within(sheet.getByLabelText("Firearm The Cannon")).queryByLabelText("Magazine of size 21 with 21 bullets remaining")).toBeNull()
        })

    });

    it('allows changing firearm use type', async () => {
        const user = userEvent.setup()
        const firearm = factories.firearmFactory({
            id: 1, base: {name: "The Cannon"},
        });

        server.use(
            rest.get("http://localhost/rest/sheets/1/sheetfirearms/", (req, res, ctx) => {
                return res(ctx.json([
                    firearm
                ]))
            }),
            rest.patch("http://localhost/rest/sheets/1/sheetfirearms/1/", async (req, res, ctx) => {
                return res(ctx.json(Object.assign({}, firearm, await req.json())))
            }),
        )

        render(<StatBlock url="/rest/sheets/1/" />)
        await waitForElementToBeRemoved(() => screen.queryAllByRole("status"), {timeout: 5000})

        const useTypeInput = screen.getByRole("combobox", {name: "Use type selection"})
        await user.click(useTypeInput)
        await user.click(await screen.findByText(/Primary/))

        await waitFor( () => {
            expect(screen.getByLabelText("Use type").textContent).toEqual("PRI")
        })
    });

    it('allows adding a clip to a firearm', async () => {
        const user = userEvent.setup()
        const firearm = factories.firearmFactory({
            id: 1,
            base: {name: "The Cannon"},
        });

        server.use(
            rest.get("http://localhost/rest/sheets/1/sheetfirearms/", (req, res, ctx) => {
                return res(ctx.json([
                    firearm
                ]))
            }),
            rest.get("http://localhost/rest/ammunition/firearm/The%20Cannon/", (req, res, ctx) => {
                return res(ctx.json([
                    factories.ammunitionFactory({
                        id: 97,
                        calibre: {name: "12FR"}
                    }),
                ]))
            }),

            rest.post("http://localhost/rest/sheets/1/sheetfirearms/1/magazines/", async (req, res, ctx) => {
                const json = await req.json();
                const respData = Object.assign({}, json, {id: 99})
            return res(ctx.json(respData))
        }),

        )

        const sheet = render(<StatBlock url="/rest/sheets/1/"/>)
        await waitForElementToBeRemoved(() => screen.queryAllByRole("status"), {timeout: 5000})

        const input = sheet.getByRole("textbox", {name: "Magazine size"})
        fireEvent.change(input, {target: {value: "21"}})
        await user.click(sheet.getByRole("button", {
                    name: "Add magazine"
                }))
        await waitFor( () => {
            within(sheet.getByLabelText("Firearm The Cannon")).findByLabelText("Magazine of size 21 with 21 bullets remaining")
        })

    })

    it('allows changing a clip in a firearm', async () => {
        const user = userEvent.setup()
        let mag = factories.magazineFactory({
            id: 42,
            capacity: 20,
            current: 15
        })

        const firearm = factories.firearmFactory({
            id: 1,
            base: {name: "The Cannon"},
            magazines: [
                mag
            ]
        });

        server.use(
            rest.get("http://localhost/rest/sheets/1/sheetfirearms/", (req, res, ctx) => {
                return res(ctx.json([
                    firearm
                ]))
            }),
            rest.get("http://localhost/rest/ammunition/firearm/The%20Cannon/", (req, res, ctx) => {
                return res(ctx.json([
                    factories.ammunitionFactory({
                        id: 97,
                        calibre: {name: "12FR"}
                    }),
                ]))
            }),

            rest.patch("http://localhost/rest/sheets/1/sheetfirearms/1/magazines/42/", async (req, res, ctx) => {
                return res(ctx.json(
                    Object.assign({}, mag, await req.json())
                ))
            }),

        )

        const sheet = render(<StatBlock url="/rest/sheets/1/"/>)
        await waitForElementToBeRemoved(document.querySelector("#loading"), {timeout: 5000})

        const firearmBlock = sheet.getByLabelText("Firearm The Cannon")

        const magNode = await within(firearmBlock).queryByLabelText("Magazine of size 20 with 15 bullets remaining")
        expect(magNode).not.toBeNull()

        await user.click(await within(firearmBlock).findByRole("button", {name: "Shoot"}))

        await waitFor( () => {
            within(sheet.getByLabelText("Firearm The Cannon")).findByLabelText("Magazine of size 20 with 14 bullets remaining")
        })
    })

});
