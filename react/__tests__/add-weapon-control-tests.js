import React from 'react';

import AddWeaponControl from "../AddWeaponControl";

const factories = require('./factories');

import {render, fireEvent, waitFor, waitForElementToBeRemoved, screen, within} from '@testing-library/react'
import { rest } from 'msw'
import { setupServer } from 'msw/node'
import userEvent from '@testing-library/user-event'

const server = setupServer(
  rest.get('http://localhost/rest/weapontemplates/campaign/1/', (req, res, ctx) => {
    return res(ctx.json([factories.weaponTemplateFactory({name: "Long sword"})]));
  }),
  rest.get('http://localhost/rest/weaponqualities/campaign/1/', (req, res, ctx) => {
    return res(ctx.json([factories.weaponQualityFactory({name: "normal"}),
        factories.weaponQualityFactory({name: "awesome"})
    ]))
  }),
  rest.get('http://localhost/rest/*/campaign/1/', (req, res, ctx) => {
    return res(ctx.json([]));
  })
)

describe('add weapon control', function() {
    beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
    afterEach(() => server.resetHandlers());
    afterAll(() => server.close());

    it("can render", async () => {
        const spy = jasmine.createSpy();
        render(<AddWeaponControl campaign={1} onAdd={spy}/>);
        await waitForElementToBeRemoved(document.querySelector("#loading"));
        const user = userEvent.setup();
        await user.click(screen.getAllByRole('button', {name: /open combobox/})[0]);
        await user.click(screen.getByText("Long sword"));

        //screen.getByText("normal");

        await user.click(screen.getAllByRole('button', {name: /open combobox/})[1]);
        await user.click(screen.getByText("awesome"));
        await user.click(screen.getByRole('button', {name: /Add Weapon/}));

        expect(spy).toHaveBeenCalled();
        const weapon = spy.calls.argsFor(0)[0];
        expect(weapon.base.name).toEqual("Long sword");
        expect(weapon.quality.name).toEqual("awesome");
    });
});
