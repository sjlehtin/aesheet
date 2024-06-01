import React from 'react';
import { screen, render } from '@testing-library/react'
import * as factories from './factories'

import WoundPenaltyBox from "WoundPenaltyBox"

describe('WoundPenaltyBox', function() {

    it("renders nicely without wounds", function () {
        render(<WoundPenaltyBox handler={factories.skillHandlerFactory()}/>)
        expect(screen.queryByLabelText("AA penalty")).not.toBeInTheDocument()
    });

    it("indicates AA penalty", function () {
        render(<WoundPenaltyBox handler={factories.skillHandlerFactory({wounds: [{damage: 5, location: "H"}]})}/>)
        expect(screen.getByLabelText("AA penalty").textContent).toContain("-50 AA")
    });

    it("indicates heart stopped effect", function () {
        render(<WoundPenaltyBox handler={factories.skillHandlerFactory({
            character: {cur_fit: 30, cur_ref: 50, cur_lrn: 50, cur_int: 50,
                cur_psy: 50, cur_wil: 50, cur_cha: 50, cur_pos: 50
            },
            wounds: [{damage: 3, location: "H"}, {damage: 2, location: "T"}]})}/>)
        expect(screen.getByLabelText("AA penalty effects").textContent).toContain("Heart stopped (FIT below zero)")
    });

    it("indicates a paralyzed effect due to ref", function () {
        render(<WoundPenaltyBox handler={factories.skillHandlerFactory({
            character: {cur_fit: 50, cur_ref: 30, cur_lrn: 50, cur_int: 50,
                cur_psy: 50, cur_wil: 50, cur_cha: 50, cur_pos: 50
            },
            wounds: [{damage: 4, location: "H"}]})}/>)
        expect(screen.getByLabelText("AA penalty effects").textContent).toContain("Paralyzed (REF below zero)")
    });

    it("indicates an unconscious effect due to wil", function () {
        render(<WoundPenaltyBox handler={factories.skillHandlerFactory({
            character: {cur_fit: 50, cur_ref: 50, cur_lrn: 50, cur_int: 50,
                cur_psy: 50, cur_wil: 30, cur_cha: 50, cur_pos: 50
            },
            wounds: [{damage: 4, location: "H"}]})}/>)
        expect(screen.getByLabelText("AA penalty effects").textContent).toContain("Unconscious (WIL below zero)")
    });

    it("indicates a shocked effect due to int", function () {
        render(<WoundPenaltyBox handler={factories.skillHandlerFactory({
            character: {cur_fit: 50, cur_ref: 50, cur_lrn: 50, cur_int: 30,
                cur_psy: 50, cur_wil: 50, cur_cha: 50, cur_pos: 50
            },
            wounds: [{damage: 4, location: "H"}]})}/>)
        expect(screen.getByLabelText("AA penalty effects").textContent).toContain("Shocked (INT below zero)")
    });

    it("indicates a shocked effect due to lrn", function () {
        render(<WoundPenaltyBox handler={factories.skillHandlerFactory({
            character: {cur_fit: 50, cur_ref: 50, cur_lrn: 30, cur_int: 50,
                cur_psy: 50, cur_wil: 50, cur_cha: 50, cur_pos: 50
            },
            wounds: [{damage: 4, location: "H"}]})}/>)
        expect(screen.getByLabelText("AA penalty effects").textContent).toContain("Shocked (LRN below zero)")
    });

    it("indicates a shocked effect due to psy", function () {
        render(<WoundPenaltyBox handler={factories.skillHandlerFactory({
            character: {cur_fit: 50, cur_ref: 50, cur_lrn: 50, cur_int: 50,
                cur_psy: 30, cur_wil: 50, cur_cha: 50, cur_pos: 50
            },
            wounds: [{damage: 4, location: "H"}]})}/>)
        expect(screen.getByLabelText("AA penalty effects").textContent).toContain("Shocked (PSY below zero)")
    });

});