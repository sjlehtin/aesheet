import React from 'react';
import AmmoControl from 'AmmoControl';

const factories = require('./factories');

import { render, screen } from '@testing-library/react'
import { rest } from 'msw'
import { setupServer } from 'msw/node'
import userEvent from '@testing-library/user-event'

const server = setupServer(
)

describe('AmmoControl', () => {
    beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
    afterEach(() => server.resetHandlers())
    afterAll(() => server.close())

    const renderAmmoControl = (props) => {
        if (!props) {
            props = {};
        }
        props.ammo = factories.ammunitionFactory(props.ammo);
        return render(<AmmoControl {...props}/>);
    };

    it('renders the ammo even without a list', async () => {
        renderAmmoControl({ammo: {calibre: {name: 'Skubadoo'}, bullet_type: "AP-HP"}});

        expect(await screen.findByText(/Skubadoo/)).toBeInTheDocument()
        expect(await screen.findByText(/AP-HP/)).toBeInTheDocument()
    });

    it('loads the ammo selection on mount', async () => {

        let ammo = factories.ammunitionFactory();

        function defer() {
            var res, rej;

            var promise = new Promise((resolve, reject) => {
                res = resolve;
                rej = reject;
            });

            promise.resolve = res;
            promise.reject = rej;

            return promise;
        }

        let deferred = defer();
        server.use(
            rest.get("http://localhost/rest/foo/", async (req, res, ctx) => {
                await deferred
                return res(ctx.json([ammo]))
            })
        )

        renderAmmoControl({ammo: {calibre: {name: 'Skubadoo'}, bullet_type: "AP-HP"},
                                        url: "/rest/foo/"});

        // Combobox should be busy until the API call to the server has been completed.
        expect(screen.queryByRole('combobox', {busy: false})).toBeNull()
        screen.getByRole('combobox', {busy: true})

        deferred.resolve();

        await screen.findByRole('combobox', {busy: false})

        // As no options have been provided, there should be none in the DOM.
        expect(screen.queryAllByRole('option', {}).length).toEqual(0)
    });

    it('allows changing the ammo', async () => {

        const user = userEvent.setup()

        const newAmmo = factories.ammunitionFactory({id: 12, bullet_type: "JHP"});

        server.use(
            rest.get("http://localhost/rest/foo/", async (req, res, ctx) => {
                return res(ctx.json([newAmmo,
                    factories.ammunitionFactory({id: 50, bullet_type: "AP-HC"})]))
            })
        )

        let spy = jest.fn().mockResolvedValue({});

        const control = renderAmmoControl({
            ammo: factories.ammunitionFactory({id: 42}),
            url: "/rest/foo/",
            onChange: spy
        });

        const el = await control.findByRole('combobox', {busy: false})

        expect(spy).not.toHaveBeenCalled()

        // Bit silly that clicking on the control element itself is not enough to open the control.
        await user.click(el.querySelector('.rw-picker-caret'));

        let options = await control.findAllByRole('option', {});

        expect(options.length).toEqual(2)

        await user.click(options[0])

        // Check that the control passes the correct value up.
        expect(spy).toHaveBeenCalledWith(newAmmo)
    });
});