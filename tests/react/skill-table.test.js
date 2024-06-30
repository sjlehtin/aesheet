import React from 'react';
import SkillTable from 'SkillTable';

import { screen, render, waitForElementToBeRemoved, within, fireEvent, prettyDOM, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import * as factories from './factories'

describe('SkillTable', function() {
    const _basicPhysical = [
        factories.skillFactory({name: "Endurance / run",
            stat: "WIL", skill_cost_0: 0}),
        factories.skillFactory({name: "Balance",
            stat: "MOV", skill_cost_0: 0}),
        factories.skillFactory({name: "Find information",
            stat: "LRN", skill_cost_0: 0}),
        factories.skillFactory({name: "Stealth"}),
        factories.skillFactory({name: "Concealment"}),
        factories.skillFactory({name: "Search",
            stat: "INT", skill_cost_0: 0}),
        factories.skillFactory({name: "Climbing"}),
        factories.skillFactory({name: "Swimming"}),
        factories.skillFactory({name: "Jump"}),
        factories.skillFactory({name: "Sleight of hand"})
    ];

     const getSkillTable = function (givenProps) {
        var props = {};
        if (givenProps) {
            props = Object.assign(props, givenProps);
        }

        var allSkills = _basicPhysical;
        if (props.allSkills) {
            allSkills = allSkills.concat(props.allSkills);
        }
        props.allSkills = allSkills;

        const skillHandler = factories.skillHandlerFactory(props);
        return <SkillTable
                    skillHandler={skillHandler}
                    onCharacterSkillAdd={props.onCharacterSkillAdd}
                    onCharacterSkillModify={props.onCharacterSkillModify}
                    onCharacterSkillRemove={props.onCharacterSkillRemove} />;
    };

    it('renders as empty', function () {
        const table = render(getSkillTable());
        expect(table.getByLabelText("SP from starting stats").textContent).toEqual("29")
    });

    it("starts with a good set of physical skills", function () {
        const table = render(getSkillTable({
            character: {cur_int: 50, cur_lrn: 50}
        }));
        const searchRow = within(screen.getByText(/Search/).closest('tr'));
        expect(searchRow.getByLabelText("Skill check").textContent).toEqual("50")
        expect(searchRow.getByLabelText("Skill level").textContent).toEqual("0")

        const infoRow = within(screen.getByText(/Find information/).closest('tr'));
        expect(infoRow.getByLabelText("Skill check").textContent).toEqual("50")
        expect(infoRow.getByLabelText("Skill level").textContent).toEqual("0")
    });

    it("does render all skills", function () {
        const table = render(getSkillTable({
            skills: [
                factories.characterSkillFactory({skill: "Search", level: 1}),
                factories.characterSkillFactory(
                    {skill: "Agriculture", level: 3})
            ]
        }));
        const elems = screen.queryAllByText(/Search/)
        expect(elems.length).toEqual(1)

        expect(within(elems[0].closest('tr')).getByLabelText("Skill level").textContent).toEqual("1")

        const agriculture = screen.getByText(/Agriculture/);
        expect(agriculture).toBeInTheDocument()
        expect(within(agriculture.closest('tr')).getByLabelText("Skill level").textContent).toEqual("3")
    });

    // -> to skillrow.  Here we just pass the callbacks forward.
    xit("allows adding a physical skill level from the start set", test.todo);
    xit("allows increasing a skill level from the start set", test.todo);
    xit("allows removing skills", test.todo);

    xit("allows adding a new skill", test.todo);

    it("calls the passed onCharacterSkillModify handler", async function () {
        const user = userEvent.setup()

        const gardeningSkill = factories.characterSkillFactory({skill: "Gardening", id: 42, level: 3});

        const data = Object.assign(
            // TODO: figure out where this is added, the passed object should not be mutated.
            {indent: 0},
            gardeningSkill,
            {level: 4});
        let spy = jasmine.createSpy("callback");
        const table = render(getSkillTable({
            onCharacterSkillModify: spy,
            skills: [gardeningSkill]
        }));

        const row = screen.getByText("Gardening").closest('tr')
        const increaseButton = within(row).getByRole("button", {name: "Increase skill level"})
        await user.click(increaseButton)
        expect(spy).toHaveBeenCalledWith(data);
    });

    it("calls the passed onCharacterSkillRemove handler", async function () {
        const user = userEvent.setup()

        const gardeningSkill = factories.characterSkillFactory({skill: "Gardening", id: 42, level: 3});

        const data = Object.assign(
            // TODO: figure out where this is added, the passed object should not be mutated.
            {indent: 0},
            gardeningSkill);
        let spy = jasmine.createSpy("callback");
        const table = render(getSkillTable({
            onCharacterSkillRemove: spy,
            skills: [gardeningSkill]
        }));

        const row = screen.getByText("Gardening").closest('tr')
        const removeButton = within(row).getByLabelText("Remove skill")
        await user.click(removeButton)
        expect(spy).toHaveBeenCalledWith(data);
    });

    it("calls the passed onCharacterSkillAdd handler", async function () {
        const user = userEvent.setup()

        const data = {level: 3, skill: "Gardening"};
        let spy = jasmine.createSpy("callback");
        const table = render(getSkillTable({
            onCharacterSkillAdd: spy,
            allSkills: [factories.skillFactory({name: "Gardening"}),]
        }));
        const skillInput = within(screen.getByLabelText("Add skill name")).getByRole("combobox")
        await user.clear(skillInput)
        await user.type(skillInput, "Gardening")
        await user.click(screen.getByText("Gardening"))

        const levelInput = within(screen.getByLabelText("Add skill level")).getByRole("combobox")
        await user.clear(levelInput)
        await user.type(levelInput, "3")

        const addButton = screen.getByRole("button", {name: "Add skill"})
        expect(addButton).not.toBeDisabled()
        await user.click(addButton)
        expect(spy).toHaveBeenCalledWith(data);
    });

    it("can calculate sp costs", function () {
        const skill = factories.skillFactory({name: "Gardening", skill_cost_0: 1,
        skill_cost_1: 1, skill_cost_2: 2, skill_cost_3: 3});
        const cs = factories.characterSkillFactory({skill: "Gardening",
            level: 3});

        expect(SkillTable.spCost(cs, skill)).toEqual(7);
        expect(SkillTable.spCost(
            Object.assign(cs, {level: 4}), skill)).toEqual(12);
        expect(SkillTable.spCost(
            Object.assign(cs, {level: 5}), skill)).toEqual(17);
        expect(SkillTable.spCost(
            Object.assign(cs, {level: 0}), skill)).toEqual(1);
        expect(SkillTable.spCost(undefined, skill)).toEqual(0);
    });

    // if the parent stores the passed object directly, state should not
    // get passed over.  TODO: test for sanitizeSkillObject usage in
    // handleCharacterSkillModify.
    xit("should clean away internal fields from parent notifications",
        test.todo);
    xit("calculates edge skill bonuses correctly and passes them to" +
        " skillrows", test.todo);
    xit("passes armor modifiers them to skillrows", test.todo);

    it("calculates SPs from edges", function () {
        const table = render(getSkillTable({
            edges: [factories.edgeLevelFactory({extra_skill_points: 6}),
                factories.edgeLevelFactory({extra_skill_points: 8})
            ]
        }));
        expect(table.getByLabelText("SP from edges").textContent).toEqual("14")
    });

    it("calculates starting SP", function () {
        const table = render(getSkillTable({character: {
            start_lrn: 50, start_int: 38, start_psy: 47}
        }));
        expect(table.getByLabelText("SP from starting stats").textContent).toEqual("30")

    });

    it("processes age SP", function () {
        const table = render(getSkillTable({character: {
            gained_sp: 23}
        }));
        expect(table.getByLabelText("SP earned during play").textContent).toEqual("23")
    });

    it("can give hints to optimize skill point accumulation", function () {
        const table = render(getSkillTable({character: {
            cur_lrn: 50, cur_int: 38, cur_psy: 47}
        }));
        expect(table.getByLabelText("SP optimization hint").textContent).toEqual("+3 LRN, +0 INT, +1 PSY")
    });
});