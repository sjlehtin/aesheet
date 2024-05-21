import React from 'react';

import { render, screen } from '@testing-library/react'

const factories = require('./factories');

import MovementRates from "MovementRates";

describe('MovementRates', function() {

    var getMovementRates = function (givenProps) {
        var skillHandler = factories.skillHandlerFactory(givenProps);

        return render(
            <MovementRates
                skillHandler={skillHandler}
            />);
    };

    it('can render', function () {
        // No effect from edges, effects to sneaking.
        const handler = getMovementRates({effects: [
            {name: "Boots of speed", run_multiplier: 2}]});

        expect(screen.getByText("Overland movement")).toBeInTheDocument()
    });

});