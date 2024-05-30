import React from 'react';

import StatBlock from 'StatBlock'

import * as factories from './factories'

import {render, waitForElementToBeRemoved, screen} from '@testing-library/react'
import { rest } from 'msw'
import { setupServer } from 'msw/node'
import {getSenseChecks, testSetup} from "./testutils";

const server = setupServer(
  rest.get('http://localhost/rest/sheets/1/', (req, res, ctx) => {
    return res(ctx.json(factories.sheetFactory()))
  }),
  rest.get('http://localhost/rest/sheets/1/*/', (req, res, ctx) => {
    return res(ctx.json([]))
  }),
  rest.get('http://localhost/rest/characters/2/', (req, res, ctx) => {
    return res(ctx.json(factories.characterFactory({cur_int: 50})))
  }),
  rest.get('http://localhost/rest/characters/2/*/', (req, res, ctx) => {
    return res(ctx.json([]))
  }),
  rest.get('http://localhost/rest/*/campaign/2/', (req, res, ctx) => {
    return res(ctx.json([]))
  }),
)

describe('stat block -- sense table', function() {
    beforeAll(() => {
        testSetup()
        server.listen({ onUnhandledRequest: 'error' })
    })
    afterEach(() => server.resetHandlers())
    afterAll(() => server.close())

    it('contains a SenseTable component', async function () {
        render(<StatBlock url={"/rest/sheets/1/"} />)
        await waitForElementToBeRemoved(() => screen.queryAllByRole("status"))

        const checks = getSenseChecks("Day vision")
        expect(checks[checks.length - 1]).toEqual(50);
        // Distance of 1k.
        expect(checks.length).toEqual(9);
    });

});
