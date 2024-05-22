import React from 'react';

import { screen, render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import TransientEffectRow from 'TransientEffectRow';
import factories from './factories';


describe('TransientEffectRow', function() {
    const getTransientEffectRow = function (givenProps) {
        let props = {
            effect: factories.sheetTransientEffectFactory()
        };
        if (givenProps) {
            props = Object.assign(props, givenProps);
        }

        return render(<table><tbody><TransientEffectRow {...props} /></tbody></table>)
    };

    it("should not render non-effects", function (){
       getTransientEffectRow({
            effect: factories.sheetTransientEffectFactory(
                {effect:  {name: "Foobaz"}})
        });
        const effectText = screen.getByLabelText("Effect").textContent
        expect(effectText).toEqual("")
    });


    it("should render the effect row", async function () {
        const user = userEvent.setup()

        const spy = jest.fn().mockResolvedValue({})
        getTransientEffectRow({
            effect: factories.sheetTransientEffectFactory(
                {effect: {name: "Foobaz", description: "This is the description", notes: "Causes lack of vision and dizziness", fit: -1, ref: 5}, id: 42}),
            onRemove: spy
        });

        expect(screen.getByLabelText("Name").textContent).toEqual("Foobaz")

        const effectText = screen.getByLabelText("Effect").textContent
        expect(effectText).toContain("-1")
        expect(effectText).toContain("+5")
        expect(effectText).not.toContain("Foobaz")
        expect(effectText).not.toContain("dizziness")

        // Should render the description in the title
        expect(screen.getByLabelText("Effect").closest('tr').getAttribute('title')).toContain("the description")

        await user.click(screen.getByRole("button", {name: "Remove"}))
        expect(spy).toHaveBeenCalledWith({id: 42})
    });
});