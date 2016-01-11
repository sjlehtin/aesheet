jest.dontMock('../SkillRow');
jest.dontMock('../sheet-util');

import React from 'react';
import ReactDOM from 'react-dom';
import TestUtils from 'react-addons-test-utils';

const SkillRow = require('../SkillRow').default;

describe('SkillRow', function() {
    "use strict";

    var nextSkillID = 0;

    var statsFactory = function (overrideStats) {
        var _baseStats = {
            cha: 45
        };
        return Object.assign(_baseStats, overrideStats);
    };

    var skillFactory = function (overrideFields) {
        var _baseSkill = {
            "name": "Acting / Bluff",
            "description": "",
            "notes": "",
            "can_be_defaulted": true,
            "is_specialization": false,
            "skill_cost_0": 2,
            "skill_cost_1": 2,
            "skill_cost_2": 3,
            "skill_cost_3": 4,
            "type": "Social",
            "stat": "CHA",
            "tech_level": 1,
            "required_skills": [],
            "required_edges": []
        };
        return Object.assign(_baseSkill, overrideFields);
    };

    var characterSkillFactory = function (overrideFields) {
        var _baseCS = {
            "id": nextSkillID,
            "level": 1,
            "character": 1,
            "skill": "Acting / Bluff"
        };
        var newSkill = Object.assign(_baseCS, overrideFields);
        /* Overriding ID is possible. */
        nextSkillID = newSkill.id + 1;
        return newSkill
    };

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

    beforeEach(function () {
        nextSkillID = 0;
    });

    it('finds skill', function () {
        var skill = skillFactory();
        var row = getSkillRow({
            characterSkill: characterSkillFactory(),
            stats: statsFactory(),
            allSkills: [skillFactory({name: "Unarmed Combat"}), skill,
            skillFactory({name: "Tracking"})]
        });
        expect(typeof(row)).not.toEqual("undefined");
        expect(row.findSkill()).toEqual(skill);
    });

    it('calculates skill check', function () {
        var row = getSkillRow({
            characterSkill: characterSkillFactory({level: 1}),
            stats: statsFactory({cha: 55}),
            allSkills: [skillFactory({stat: "CHA"})]});
        expect(row.skillCheck()).toEqual(60);
    });

    it('recognizes base skills', function () {
        // i.e., does not render the skill check.
        var row = getSkillRow({
            characterSkill: characterSkillFactory({level: 0}),
            stats: statsFactory({cha: 55}),
            allSkills: [skillFactory({stat: "CHA",
            skill_cost_1: null,
                skill_cost_2: null,
                skill_cost_3: null
            })]});
        expect(row.skillCheck()).toEqual(null);
    });

    it('can render defaulted skills', function () {
        // i.e., does not render the skill check.
        var row = getSkillRow({
            skillName: "Acting / Bluff",
            stats: statsFactory({cha: 55}),
            allSkills: [skillFactory({stat: "CHA"})]});
        expect(row.skillCheck()).toEqual(28);
    });

    it('can find a skill check for a different stat', function () {
        // i.e., does not render the skill check.
        var row = getSkillRow({
            characterSkill: characterSkillFactory({level: 1}),
            stats: statsFactory({cha: 45, wil: 60}),
            allSkills: [skillFactory({stat: "CHA"})],

        });
        expect(row.skillCheck("wil")).toEqual(65);
    });

    it('can render skill checks for multiple stats', function () {
        // i.e., does not render the skill check.
        var row = getSkillRow({
            characterSkill: characterSkillFactory({
                skill: "Balance",
                level: 1}),
            stats: statsFactory({mov: 45, ref: 60}),
            allSkills: [skillFactory({name: "Balance", stat: "MOV"})],
            renderForStats: ["mov", "ref"]
        });
        console.log("foo");
        var cell = TestUtils.findRenderedDOMComponentWithClass(row,
            "skill-check");
        console.log("bar");

        expect(cell.textContent).toContain("REF: 65");
        expect(cell.textContent).toContain("MOV: 50");
    });

});