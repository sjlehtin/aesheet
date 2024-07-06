import React from 'react';
import StatBreakdown from "../react/StatBreakdown";

import {render, screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ValueBreakdown from "../react/ValueBreakdown";

describe('StatBreakdown', function() {

    it('renders value', async function () {
        render(<StatBreakdown value={5} breakdown={[{value: 4, reason: "foo"}, {value: 1, reason: "bar"}]} />)
        expect(screen.getByLabelText("Skill check").textContent).toEqual("5")
    })

    it('renders ValueBreakdown', async function () {
        const bd = new ValueBreakdown()
        bd.add(4, "foo")
        bd.add(1, "bar")
        render(<StatBreakdown value={bd} />)
        expect(screen.getByLabelText("Skill check").textContent).toEqual("5")
    })

})
