import React from 'react';

import { screen, render, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import DetectionLevelControl from 'DetectionLevelControl';

describe('DetectionLevelControl', () => {

    it('uses initial value for detection level', async () => {
        const user = userEvent.setup()
        let spy = jest.fn();
        render(<DetectionLevelControl onChange={spy} initialDetectionLevel={-3} />)

        expect(screen.getByDisplayValue(/Moonlight/)).toBeInTheDocument()

        const input = screen.getByRole("combobox", {name: "Darkness DL"});
        await user.selectOptions(input, ["-2"])
        await waitFor(() => expect(spy).toHaveBeenCalledWith(-2))
    });

});