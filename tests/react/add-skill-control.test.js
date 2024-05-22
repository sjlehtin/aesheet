import React from 'react';

import { screen, render, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import AddSkillControl from 'AddSkillControl';
import SkillTable from 'SkillTable';
const factories = require('./factories');


describe('AddSkillControl', function() {

    var _basicSkills = [
        factories.skillFactory({name: "Endurance / run",
            stat: "WIL", skill_cost_0: 0, type: "Physical"}),
        factories.skillFactory({name: "Persuasion", type: "Social"}),
        factories.skillFactory({name: "Mental Fortitude", type: "Mystical"}),
        factories.skillFactory({name: "Two-weapon Style", type: "Physical",
            min_level: 1, max_level: 4 })
    ];

    var findSkill = function(skills, skillName) {
        for (var skill of skills) {
            if (skill.name === skillName) {
                return skill;
            }
        }
        throw Error("skill " + skillName + " not found");
    };

    const renderAddSkillControl = function (givenProps) {
        var props = {allSkills: _basicSkills,
            characterSkillMap: {}
        };
        if (typeof(givenProps) !== "undefined") {
            props = Object.assign(props, givenProps);
        }

        return render(<AddSkillControl {...props}/>)
    };

    it("can filter skills the user already has", async function () {
        const user = userEvent.setup()

        renderAddSkillControl({characterSkillMap:
            SkillTable.getCharacterSkillMap([
                factories.characterSkillFactory({skill: "Persuasion"})])});

        await user.click(within(screen.getByLabelText("Add skill name")).getByRole("button"))
        let values = []
        within(screen.getByLabelText("Add skill name")).queryAllByRole("option").forEach((el) => {values.push(el.textContent)})

        expect(values).toEqual(["Endurance / run", "Two-weapon Style", "Mental Fortitude"]);

    });

    it("can render correct values for skill level based on selected skill", async function () {
        const user = userEvent.setup()

        renderAddSkillControl();

        const skillInput = within(screen.getByLabelText("Add skill name")).getByRole("combobox")
        await user.clear(skillInput)
        await user.type(skillInput, "Two-wea")
        await user.click(screen.getByText("Two-weapon Style"))

        await user.click(within(screen.getByLabelText("Add skill level")).getByRole("button"))

        const levelInput = within(screen.getByLabelText("Add skill level")).getByRole("combobox")

        // The default level should be the lowest possible to select
        expect(levelInput.value).toEqual("1")

        let values = []
        within(screen.getByLabelText("Add skill level")).queryAllByRole("option").forEach((el) => {values.push(el.textContent)})

        expect(values).toEqual(["1", "2", "3", "4"])
    });

    it("will not barf if skill value is not found", async function () {
        const user = userEvent.setup()

        renderAddSkillControl();

        const skillInput = within(screen.getByLabelText("Add skill name")).getByRole("combobox")
        await user.clear(skillInput)
        await user.type(skillInput, "foo")

        await user.click(within(screen.getByLabelText("Add skill level")).getByRole("button"))

        let values = []
        within(screen.getByLabelText("Add skill level")).queryAllByRole("option").forEach((el) => {values.push(el.textContent)})
        expect(values.length).toEqual(0)
    });

    it("enables the addition button with valid input", async function () {
        const user = userEvent.setup()

        renderAddSkillControl();

        const addButton = screen.getByRole("button", {name: "Add skill"})

        // Expect the button to start disabled.
        expect(addButton).toBeDisabled()

        const skillInput = within(screen.getByLabelText("Add skill name")).getByRole("combobox")
        await user.clear(skillInput)
        await user.type(skillInput, "Pers")
        await user.click(screen.getByText("Persuasion"))

        const levelInput = within(screen.getByLabelText("Add skill level")).getByRole("combobox")
        await user.clear(levelInput)
        await user.type(levelInput, "foo")

        expect(addButton).toBeDisabled()

        await user.clear(levelInput)
        await user.type(levelInput, "2")

        expect(addButton).not.toBeDisabled()
    });

    it("calls the skill addition callback on skill add", async function () {
        const user = userEvent.setup()
        const spy = jasmine.createSpy("callback");

        renderAddSkillControl({onCharacterSkillAdd: spy});

        const skillInput = within(screen.getByLabelText("Add skill name")).getByRole("combobox")
        await user.clear(skillInput)
        await user.type(skillInput, "Pers")
        await user.click(screen.getByText("Persuasion"))

        const levelInput = within(screen.getByLabelText("Add skill level")).getByRole("combobox")
        await user.clear(levelInput)
        await user.type(levelInput, "2")

        const addButton = screen.getByRole("button", {name: "Add skill"})
        expect(addButton).not.toBeDisabled()
        await user.click(addButton)
        expect(spy).toHaveBeenCalledWith({skill: "Persuasion", level: 2});
    });

});
