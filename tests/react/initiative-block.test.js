import React from 'react';

import {render, screen, within} from '@testing-library/react'
import InitiativeBlock from "InitiativeBlock";
import userEvent from "@testing-library/user-event";

var factories = require('./factories');

describe('InitiativeBlock', function() {
    const renderInitiativeBlock = function (props) {
        if (!props) {
            props = {};
        }
        var skillHandlerProps = {};
        if (props.stats) {
            skillHandlerProps = props.stats;
            delete props.stats;
        }
        props.stats  = factories.skillHandlerFactory(
            skillHandlerProps);
        return render(
            <InitiativeBlock {...props} />);
    };

    function getInitiatives(initLabel) {
        let values = []
        within(screen.getByLabelText(initLabel)).getAllByRole("cell", {name: "check"}).forEach((el) => {
            values.push(el.textContent)
        })
        return values;
    }

    it('allows calculating initiatives for arbitrary values', function () {
        renderInitiativeBlock({stats: {
            character: {
                cur_fit: 52,
                cur_ref: 52
            }}});

        let values = getInitiatives("Charge initiatives");

        expect(values).toEqual(["-12","-8","-4","-2","-1"]);
    });

    it('does not overflow to positive if character unable to mov', function () {
        renderInitiativeBlock({stats: {
            character: {
                cur_fit: -100,
                cur_ref: -100
            }}});

        let values = getInitiatives("Charge initiatives");

        expect(values).toEqual(["-","-","-","-","-"]);
    });

    it('allows free-form input', async function () {
        const user = userEvent.setup()

        renderInitiativeBlock({stats: {
            character: {
                cur_fit: 52,
                cur_ref: 52
            }
        }});

        const input = screen.getByRole("textbox", {name: "Distance"})

        await user.clear(input)
        await user.type(input, "25")

        expect(getInitiatives("Charge initiatives")).toEqual(["-10","-8","-4","-2","-1"])
        expect(getInitiatives("Melee initiatives")).toEqual(["-15","-12","-6","-3","-2"])
        expect(getInitiatives("Ranged initiatives")).toEqual(["-29","-24","-12","-6","-3"])
    });
});