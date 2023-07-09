jest.dontMock('SkillRow');
jest.dontMock('sheet-util');
jest.dontMock('SkillHandler');
jest.dontMock('./factories');

import React from 'react';
import ReactDOM from 'react-dom';
import TestUtils from 'react-dom/test-utils';
import createReactClass from 'create-react-class';

var factories = require('./factories');

var characterSkillFactory = factories.characterSkillFactory;
var skillFactory = factories.skillFactory;

import SkillRow from 'SkillRow'

import { render, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const renderSkillRow = (givenProps) => {
    let props = {skill: "Unarmed Combat"};
    if (typeof(givenProps) !== "undefined") {
        props = Object.assign(props, givenProps);
    }

    return render(<table><tbody>
    <SkillRow {...props} />
    </tbody></table>)
}

describe('SkillRow', function() {
    "use strict";

    var getSkillRow = function (givenProps) {
        var props = {skill: "Unarmed Combat"};
        if (typeof(givenProps) !== "undefined") {
            props = Object.assign(props, givenProps);
        }

        // TODO: React TestUtils suck a bit of a balls.
        var Wrapper = createReactClass({
            render: function() {
                return <table><tbody>{this.props.children}</tbody></table>;
            }
        });

        var row = <SkillRow {...props}/>;
        var table = TestUtils.renderIntoDocument(
            <Wrapper>
                {row}
            </Wrapper>
        );

        return TestUtils.findRenderedComponentWithType(table,
            SkillRow);
    };



    it('calculates skill check', function () {
        const row = renderSkillRow({
            skillName: "Persuasion",
            skillHandler: factories.skillHandlerFactory({
                character: {cur_cha: 55},
                skills: [
                    {skill: {name: "Persuasion", stat: "CHA"}, level: 1}],
            }),

            characterSkill: characterSkillFactory({level: 1}),
            skill: skillFactory({stat: "CHA"})});
        expect(row.getByLabelText("Skill check").textContent).toEqual("60")
    });

    it('recognizes base skills', function () {
        // i.e., does not render the skill check.
        const row = renderSkillRow({
            skillName: "Basic Farmhand",
            skillHandler: factories.skillHandlerFactory({
                skills: [
                    {skill: {name: "Basic Farmhand", stat: "CHA", skill_cost_1: null},
                        level: 0}],
            }),
            characterSkill: characterSkillFactory({level: 0}),
            skill: skillFactory({stat: "CHA",
            skill_cost_1: null,
                skill_cost_2: null,
                skill_cost_3: null
            })});

        expect(row.getByLabelText("Skill check").textContent).toEqual("")
    });

    it('can render defaulted skills', function () {
        const row = renderSkillRow({
            skillName: "Acting / Bluff",
            skillHandler: factories.skillHandlerFactory({
                character: {cur_cha: 55},
                allSkills: [{skill: "Acting / Bluff", stat: "CHA"}]
            }),

            skill: skillFactory({stat: "CHA"})});
        expect(row.getByLabelText("Skill check").textContent).toEqual("28")
    });

    it('can render skills which are available without cost', function () {
        const row = renderSkillRow({
            skillName: "Acting / Bluff",
            skillHandler: factories.skillHandlerFactory({
                character: {cur_cha: 55},
                allSkills: [{
                    name: "Acting / Bluff",
                    skill_cost_0: 0,
                    stat: "CHA"}]
            }),
            skill: skillFactory({stat: "CHA", skill_cost_0: 0})});
        expect(row.getByLabelText("Skill check").textContent).toEqual("55")
    });

    it('can find a skill check for a different stat', function () {
        const row = renderSkillRow({
            renderForStats: ["wil"],
            skillName: "Acting / Bluff",
            skillHandler: factories.skillHandlerFactory({
                character: {cur_wil: 60, cur_cha: 45},
                skills: [{skill: "Acting / Bluff"}]
            }),

            characterSkill: characterSkillFactory({level: 1}),
            skill: skillFactory({stat: "CHA"})
        });
        expect(row.getByLabelText("Skill check").textContent).toEqual("WIL: 65")
    });

    it('can render skill checks for multiple stats', function () {
        const row = renderSkillRow({
            skillName: "Balance",
            skillHandler: factories.skillHandlerFactory({
                character: {cur_fit: 50, cur_ref: 60},
                skills: [{skill: "Balance", level: 1}]
            }),

            characterSkill: characterSkillFactory({
                skill: "Balance",
                level: 1}),
            skill: skillFactory({name: "Balance", stat: "MOV"}),
            renderForStats: ["mov", "ref"]
        });

        let elem = row.getByLabelText("Skill check");
        expect(elem.textContent).toContain("REF: 65")
        expect(elem.textContent).toContain("MOV: 60")
    });

    xit("shows skill with obsoleted skill level", test.todo);
    xit("highlight skill with missing required skills", test.todo);

    it('has controls to increase skill levels', async () => {
        const user = userEvent.setup();
        const spy = jest.fn().mockResolvedValue();
        const cs = characterSkillFactory({level: 1});
        const row = renderSkillRow({
            skillName: "Balance",
            skillHandler: factories.skillHandlerFactory({
                skills: [{skill: "Balance", level: 1}]
            }),

            characterSkill: cs,
            skill: skillFactory({stat: "CHA"}),
            onCharacterSkillModify: spy
        });
        const el = row.getByRole("button", {name: "Increase skill level"})
        await user.click(el)
        expect(spy).toHaveBeenCalledWith(Object.assign({}, cs, {level: 2}))

        // ARIA spec says that the button role should be actionable with Enter and Space keys as well as click.
        spy.mockClear()
        expect(spy).not.toHaveBeenCalled()
        await el.focus()
        await user.keyboard("{Space}")
        expect(spy).toHaveBeenCalledWith(Object.assign({}, cs, {level: 2}))

        spy.mockClear()
        expect(spy).not.toHaveBeenCalled()
        await el.focus()
        await user.keyboard("{Enter}")
        expect(spy).toHaveBeenCalledWith(Object.assign({}, cs, {level: 2}))

    });

    it('has controls to decrease skill levels', async () => {
        const user = userEvent.setup()
        const spy = jest.fn().mockResolvedValue()
        const cs = characterSkillFactory({level: 1})
        const row = renderSkillRow({
            skillName: "Balance",
            skillHandler: factories.skillHandlerFactory({
                skills: [{skill: "Balance", level: 1}]
            }),

            characterSkill: cs,
            skill: skillFactory({stat: "CHA"}),
            onCharacterSkillModify: spy
        })
        const el = row.getByRole("button", {name: "Decrease skill level"})
        await user.click(el)
        expect(spy).toHaveBeenCalledWith(Object.assign({}, cs, {level: 0}))

        // ARIA spec says that the button role should be actionable with Enter and Space keys as well as click.
        spy.mockClear()
        expect(spy).not.toHaveBeenCalled()
        await el.focus()
        await user.keyboard("{Space}")
        expect(spy).toHaveBeenCalledWith(Object.assign({}, cs, {level: 2}))

        spy.mockClear()
        expect(spy).not.toHaveBeenCalled()
        await el.focus()
        await user.keyboard("{Enter}")
        expect(spy).toHaveBeenCalledWith(Object.assign({}, cs, {level: 2}))
    });

    it('should not have a level controls without a skill', function () {
        const row = renderSkillRow({
            skillName: "Balance",
            skillHandler: factories.skillHandlerFactory({
                allSkills: [{name: "Balance", level: 1}]
            }),

            characterSkill: undefined,
            skill: skillFactory({stat: "CHA"})
        })
        expect(row.queryByRole("button", {name: "Decrease skill level"})).toBeNull()
        expect(row.queryByRole("button", {name: "Inccrease skill level"})).toBeNull()
    });

    it('should not have a decrease control if skill at minimum level',
        function () {
        const cs = characterSkillFactory({level: 1});
        const row = renderSkillRow({
            skillName: "Balance",
            skillHandler: factories.skillHandlerFactory({
                skills: [{skill: {name: "Balance", min_level: 1}, level: 1}]
            }),

            characterSkill: cs,
            skill: skillFactory({stat: "CHA", min_level: 1})
        })
        expect(row.queryByRole("button", {name: "Decrease skill level"})).toBeNull()
        expect(row.getByRole("button", {name: "Increase skill level"})).toBeTruthy()
    });

    it('should not have a increase control if skill at maximum level',
        function () {
        const cs = characterSkillFactory({level: 3});
        const row = renderSkillRow({
            skillName: "Balance",
            skillHandler: factories.skillHandlerFactory({
                skills: [{skill: {name: "Balance", max_level: 3}, level: 3}]
            }),

            characterSkill: cs,
            skill: skillFactory({stat: "CHA", max_level: 3})
        });
        expect(row.queryByRole("button", {name: "Increase skill level"})).toBeNull()
        expect(row.getByRole("button", {name: "Decrease skill level"})).toBeTruthy()
    });

    it("does not render missing skills if there are none", function () {
        const cs = characterSkillFactory({level: 3});
        const row = renderSkillRow({
            skillName: "Balance",
            skillHandler: factories.skillHandlerFactory({
                skills: [{skill: "Balance", level: 3}]
            }),

            characterSkill: cs,
            skill: skillFactory({stat: "CHA", max_level: 3}),
        });
        const elems = row.queryAllByTitle(/Missing/)
        expect(elems.length).toEqual(0)
    });

    it("renders missing skill", function () {
        const cs = characterSkillFactory({level: 3});
        cs._missingRequired = ["Frozzling"];
        const row = renderSkillRow({
            skillName: "Pistol",
            skillHandler: factories.skillHandlerFactory({
                skills: [{skill: {name: "Pistol", required_skills: ["Frozzling"]}, level: 3}],
                allSkills: [{name: "Frozzling"}]
            }),
            characterSkill: cs,
            skill: skillFactory({stat: "CHA", max_level: 3}),
        });
        const elems = row.queryAllByTitle(/Missing/)
        expect(elems.length).toEqual(1)
        const el = elems[0]
        expect(el.title).toMatch("Missing skill Frozzling")
    });

    it("renders all missing skills", function () {
        let cs = characterSkillFactory({level: 3});
        cs._missingRequired = ["Frozzling", "Foobying"];
        const row = renderSkillRow({
            skillName: "Pistol",
            skillHandler: factories.skillHandlerFactory({
                skills: [{skill: {name: "Pistol", required_skills: ["Frozzling", "Foobying"]}, level: 3}],
                allSkills: [{name: "Frozzling"}, {name: "Foobying"}]
            }),
            characterSkill: cs,
            skill: skillFactory({stat: "CHA", max_level: 3}),
        });
        const elems = row.queryAllByTitle(/Missing/)
        expect(elems.length).toEqual(1)
        const el = row.getByTitle(/Missing skills/)
        expect(el.title).toContain('Frozzling')
        expect(el.title).toContain('Foobying')
    })

});