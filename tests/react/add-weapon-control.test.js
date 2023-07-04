import React from 'react';

import AddWeaponControl from "AddWeaponControl";

const factories = require('./factories');

import {render, fireEvent, waitFor, waitForElementToBeRemoved, screen, within} from '@testing-library/react'
import { rest } from 'msw'
import { setupServer } from 'msw/node'
import userEvent from '@testing-library/user-event'

const longSwordTemplate = factories.weaponTemplateFactory({name: "Long sword"});

const normalQuality = factories.weaponQualityFactory({name: "normal"});
const awesomeQuality = factories.weaponQualityFactory({name: "awesome"});

const awesomeLongSword = factories.weaponFactory({base: longSwordTemplate, quality: awesomeQuality, name: "Awesome long sword"});

const server = setupServer(
  rest.get('http://localhost/rest/weapontemplates/campaign/1/', (req, res, ctx) => {
      return res(ctx.json([longSwordTemplate]));
  }),
  rest.get('http://localhost/rest/weaponqualities/campaign/1/', (req, res, ctx) => {
      return res(ctx.json([normalQuality, awesomeQuality
    ]))
  }),
  rest.get('http://localhost/rest/weapons/campaign/1/', (req, res, ctx) => {
      return res(ctx.json([awesomeLongSword]));
  }),
  rest.get('http://localhost/rest/*/campaign/1/', (req, res, ctx) => {
    return res(ctx.json([]));
  })
)

describe('add weapon control', function() {
    beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
    afterEach(() => server.resetHandlers());
    afterAll(() => server.close());

    it("can choose weapon templates and qualities", async () => {
        const spy = jasmine.createSpy();
        render(<AddWeaponControl campaign={1} onAdd={spy}/>);
        await waitForElementToBeRemoved(document.querySelector("#loading"));

        const user = userEvent.setup();

        // Default quality should allow adding the weapon immediately.
        await user.click(screen.getAllByRole('button', {name: /open combobox/})[0]);
        await user.click(screen.getByRole('option', {name: "Long sword"}));
        screen.getByDisplayValue("normal");
        const button = screen.getByRole('button', {name: /Add Weapon/});
        expect(button).not.toHaveAttribute("disabled");
        await user.click(button);
        expect(spy).toHaveBeenCalled();
        const firstWeapon = spy.calls.argsFor(0)[0];
        expect(firstWeapon.base.name).toEqual("Long sword");
        expect(firstWeapon.quality.name).toEqual("normal");
        spy.calls.reset();

        // Default quality field should still be filled.
        screen.getByDisplayValue("normal");

        // Existing weapon (with template and quality) should show immutable quality.
        await user.click(screen.getAllByRole('button', {name: /open combobox/})[0]);
        await user.click(screen.getByText("Awesome long sword"));
        screen.getByText("awesome");

        await user.click(screen.getByRole('option', {name: "Long sword"}));
        screen.getByDisplayValue("normal");
        await user.click(screen.getAllByRole('button', {name: /open combobox/})[1]);
        await user.click(screen.getByRole('option', {name: "awesome"}));
        await user.click(screen.getByRole('button', {name: /Add Weapon/}));

        expect(spy).toHaveBeenCalled();
        const weapon = spy.calls.argsFor(0)[0];
        expect(weapon.base.name).toEqual("Long sword");
        expect(weapon.quality.name).toEqual("awesome");
    });
});
