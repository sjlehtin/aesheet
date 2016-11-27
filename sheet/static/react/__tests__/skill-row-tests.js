jest.dontMock('../SkillRow');
jest.dontMock('../sheet-util');
jest.dontMock('./factories');
jest.dontMock('../SkillHandler');

import React from 'react';
import ReactDOM from 'react-dom';
import TestUtils from 'react-addons-test-utils';

var factories = require('./factories');

var characterSkillFactory = factories.characterSkillFactory;
var skillFactory = factories.skillFactory;

const SkillRow = require('../SkillRow').default;

describe('SkillRow', function() {
    "use strict";

    var getSkillRow = function (givenProps) {
        var props = {skill: "Unarmed Combat"};
        if (typeof(givenProps) !== "undefined") {
            props = Object.assign(props, givenProps);
        }

        // TODO: React TestUtils suck a bit of a balls.
        var Wrapper = React.createClass({
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
        var row = getSkillRow({
            skillName: "Persuasion",
            skillHandler: factories.skillHandlerFactory({
                character: {cur_cha: 55},
                skills: [
                    {skill: {name: "Persuasion", stat: "CHA"}, level: 1}],
            }),

            characterSkill: characterSkillFactory({level: 1}),
            skill: skillFactory({stat: "CHA"})});
        expect(row.skillCheck()).toEqual(60);
    });

    it('recognizes base skills', function () {
        // i.e., does not render the skill check.
        var row = getSkillRow({
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
        expect(row.skillCheck()).toEqual(null);
    });

    it('can render defaulted skills', function () {
        var row = getSkillRow({
            skillName: "Acting / Bluff",
            skillHandler: factories.skillHandlerFactory({
                character: {cur_cha: 55},
                allSkills: [{skill: "Acting / Bluff", stat: "CHA"}]
            }),

            skill: skillFactory({stat: "CHA"})});
        expect(row.skillCheck()).toEqual(28);
    });

    it('can render skills which are available without cost', function () {
        var row = getSkillRow({
            skillName: "Acting / Bluff",
            skillHandler: factories.skillHandlerFactory({
                character: {cur_cha: 55},
                allSkills: [{
                    name: "Acting / Bluff",
                    skill_cost_0: 0,
                    stat: "CHA"}]
            }),
            skill: skillFactory({stat: "CHA", skill_cost_0: 0})});
        expect(row.skillCheck()).toEqual(55);
    });

    it('can find a skill check for a different stat', function () {
        var row = getSkillRow({
            skillName: "Acting / Bluff",
            skillHandler: factories.skillHandlerFactory({
                character: {cur_wil: 60, cur_cha: 45},
                skills: [{skill: "Acting / Bluff"}]
            }),

            characterSkill: characterSkillFactory({level: 1}),
            skill: skillFactory({stat: "CHA"})
        });
        expect(row.skillCheck("wil")).toEqual(65);
    });

    it('can render skill checks for multiple stats', function () {
        var row = getSkillRow({
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
        var cell = TestUtils.findRenderedDOMComponentWithClass(row,
            "skill-check");

        expect(cell.textContent).toContain("REF: 65");
        expect(cell.textContent).toContain("MOV: 60");
    });

    xit("shows skill with obsoleted skill level");
    xit("highlight skill with missing required skills");

    it('has controls to increase skill levels', function () {
        var spy = jasmine.createSpy("callback");
        var cs = characterSkillFactory({level: 1});
        var row = getSkillRow({
            skillName: "Balance",
            skillHandler: factories.skillHandlerFactory({
                skills: [{skill: "Balance", level: 1}]
            }),

            characterSkill: cs,
            skill: skillFactory({stat: "CHA"}),
            onCharacterSkillModify: spy
        });
        TestUtils.Simulate.click(ReactDOM.findDOMNode(row._increaseButton))
        expect(spy).toHaveBeenCalledWith(Object.assign({}, cs, {level: 2}))
    });

    it('has controls to decrease skill levels', function () {
        var spy = jasmine.createSpy("callback");
        var cs = characterSkillFactory({level: 1});
        var row = getSkillRow({
            skillName: "Balance",
            skillHandler: factories.skillHandlerFactory({
                skills: [{skill: "Balance", level: 1}]
            }),

            characterSkill: cs,
            skill: skillFactory({stat: "CHA"}),
            onCharacterSkillModify: spy
        });
        TestUtils.Simulate.click(ReactDOM.findDOMNode(row._decreaseButton))
        expect(spy).toHaveBeenCalledWith(Object.assign({}, cs, {level: 0}))
    });

    it('should not have a decrease control without a skill', function () {
        var spy = jasmine.createSpy("callback");
        var row = getSkillRow({
            skillName: "Balance",
            skillHandler: factories.skillHandlerFactory({
                allSkills: [{name: "Balance", level: 1}]
            }),

            characterSkill: undefined,
            skill: skillFactory({stat: "CHA"}),
            onCharacterSkillModify: spy
        });
        expect('_decreaseButton' in row).toEqual(false);
    });

    it('should not have a decrease control if skill at minimum level',
        function () {
        var spy = jasmine.createSpy("callback");
        var cs = characterSkillFactory({level: 1});
        var row = getSkillRow({
            skillName: "Balance",
            skillHandler: factories.skillHandlerFactory({
                skills: [{skill: {name: "Balance", min_level: 1}, level: 1}]
            }),

            characterSkill: cs,
            skill: skillFactory({stat: "CHA", min_level: 1}),
            onCharacterSkillModify: spy
        });
        expect('_decreaseButton' in row).toEqual(false);
    });

    it('should not have a increase control without a skill', function () {
        var spy = jasmine.createSpy("callback");
        var row = getSkillRow({
            skillName: "Balance",
            skillHandler: factories.skillHandlerFactory({
                allSkills: [{name: "Balance"}]
            }),
            characterSkill: undefined,
            skill: skillFactory({stat: "CHA"}),
            onCharacterSkillModify: spy
        });
        expect('_increaseButton' in row).toEqual(false);
    });

    it('should not have a increase control if skill at maximum level',
        function () {
        var spy = jasmine.createSpy("callback");
        var cs = characterSkillFactory({level: 3});
        var row = getSkillRow({
            skillName: "Balance",
            skillHandler: factories.skillHandlerFactory({
                skills: [{skill: {name: "Balance", max_level: 3}, level: 3}]
            }),

            characterSkill: cs,
            skill: skillFactory({stat: "CHA", max_level: 3}),
            onCharacterSkillModify: spy
        });
        expect('_increaseButton' in row).toEqual(false);
    });

    it("does not render missing skills if there are none", function () {
        var cs = characterSkillFactory({level: 3});
        var row = getSkillRow({
            skillName: "Balance",
            skillHandler: factories.skillHandlerFactory({
                skills: [{skill: "Balance", level: 3}]
            }),

            characterSkill: cs,
            skill: skillFactory({stat: "CHA", max_level: 3}),
        });
        var node = ReactDOM.findDOMNode(row);
        expect(node.getAttribute('title')).toEqual('');
    });

    it("renders missing skills", function () {
        var cs = characterSkillFactory({level: 3});
        cs._missingRequired = ["Frozzling"];
        var row = getSkillRow({
            skillName: "Pistol",
            skillHandler: factories.skillHandlerFactory({
                skills: [{skill: {name: "Pistol", required_skills: ["Frozzling"]}, level: 3}],
                allSkills: [{name: "Frozzling"}]
            }),
            characterSkill: cs,
            skill: skillFactory({stat: "CHA", max_level: 3}),
        });
        var node = ReactDOM.findDOMNode(row);
        expect(node.getAttribute('title')).toMatch("Missing skill Frozzling");
    });

    it("renders missing skills with correct grammar", function () {
        var cs = characterSkillFactory({level: 3});
        cs._missingRequired = ["Frozzling", "Foobying"];
        var row = getSkillRow({
            skillName: "Pistol",
            skillHandler: factories.skillHandlerFactory({
                skills: [{skill: {name: "Pistol", required_skills: ["Frozzling", "Foobying"]}, level: 3}],
                allSkills: [{name: "Frozzling"}, {name: "Foobying"}]
            }),
            characterSkill: cs,
            skill: skillFactory({stat: "CHA", max_level: 3}),
        });
        var node = ReactDOM.findDOMNode(row);
        expect(node.getAttribute('title')).toMatch("Missing skills" +
            " Frozzling, Foobying");
    })

});