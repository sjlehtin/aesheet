jest.dontMock('../AddSkill');
jest.dontMock('../SkillRow');
jest.dontMock('../SkillTable');
jest.dontMock('./factories');
import React from 'react';
import ReactDOM from 'react-dom';
import TestUtils from 'react-addons-test-utils';

const SkillTable = require('../SkillTable').default;
const AddSkill = require('../AddSkill').default;

var rest = require('sheet-rest');

var factories = require('./factories');

describe('AddSkill', function() {
    "use strict";

    var _basicSkills = [
        factories.skillFactory({name: "Endurance / run",
            stat: "WIL", skill_cost_0: 0, type: "Physical"}),
        factories.skillFactory({name: "Persuasion", type: "Social"}),
        factories.skillFactory({name: "Mental Fortitude", type: "Mystical"})
    ];

    var findSkill = function(skills, skillName) {
        for (var skill of skills) {
            if (skill.name === skillName) {
                return skill;
            }
        }
        throw Error("skill " + skillName + " not found");
    };

    var getAddSkill = function (givenProps) {
        var props = {allSkills: _basicSkills,
            characterSkillMap: {}
        };
        if (typeof(givenProps) !== "undefined") {
            props = Object.assign(props, givenProps);
        }
        var table = TestUtils.renderIntoDocument(
            <AddSkill {...props}/>
        );

        return TestUtils.findRenderedComponentWithType(table,
            AddSkill);
    };

    it("can filter skills the user already has", function () {
        var filteredList = AddSkill.filterSkills(_basicSkills,
            SkillTable.getCharacterSkillMap([factories.characterSkillFactory({skill: "Persuasion"})]));
        var names = filteredList.map((elem) => { return elem.name} );
        expect(names).toEqual(["Endurance / run", "Mental Fortitude"]);
    });

    it("can render correct values for skill level based on selected skill", function () {
        var skillList = [].concat([factories.skillFactory({
            name: "Two-weapon Style", type: "Physical",
            min_level: 1, max_level: 4 })],
            _basicSkills);

        var control = getAddSkill({allSkills: skillList});
        expect(control.getLevelChoices()).toEqual([]);

        control.handleSkillChange(findSkill(skillList,
            "Two-weapon Style"));
        expect(control.getLevelChoices()).toEqual([1, 2, 3, 4]);
    });

    it("will not barf if skill value is not found", function () {
        var control = getAddSkill();
        expect(control.getLevelChoices()).toEqual([]);
        control.handleSkillChange("foobar");
        expect(control.getLevelChoices()).toEqual([]);
    });

    it("defaults to lowest skill level based on selected skill", function () {
        // TODO
    });

    it("starts with the add button disabled", function () {
        var control = getAddSkill();
        expect(control.skillValid()).toEqual(false);
    });

    it("enables the addition button with valid input", function () {
        var control = getAddSkill();
        control.handleSkillChange(findSkill(_basicSkills, "Persuasion"));
        control.handleLevelChange("foo");
        expect(control.skillValid()).toEqual(false);
        control.handleLevelChange(2);
        expect(control.skillValid()).toEqual(true);
    });

    it("calls the skill addition callback on skill add", function () {
        var spy = jasmine.createSpy("callback");
        var control = getAddSkill({onCharacterSkillAdd: spy});
        control.handleSkillChange(findSkill(_basicSkills, "Persuasion"));
        control.handleLevelChange(2);
        TestUtils.Simulate.click(ReactDOM.findDOMNode(control._addButton));
        expect(spy).toHaveBeenCalledWith({skill: "Persuasion", level: 2});
    });

});
