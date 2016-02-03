jest.dontMock('../SkillRow');
jest.dontMock('../sheet-util');
jest.dontMock('./factories')

import React from 'react';
import ReactDOM from 'react-dom';
import TestUtils from 'react-addons-test-utils';

var factories = require('./factories');

var characterSkillFactory = factories.characterSkillFactory;
var skillFactory = factories.skillFactory;
var statsFactory = factories.statsFactory;

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
            characterSkill: characterSkillFactory({level: 1}),
            stats: statsFactory({cha: 55}),
            skill: skillFactory({stat: "CHA"})});
        expect(row.skillCheck()).toEqual(60);
    });

    it('recognizes base skills', function () {
        // i.e., does not render the skill check.
        var row = getSkillRow({
            characterSkill: characterSkillFactory({level: 0}),
            stats: statsFactory({cha: 55}),
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
            stats: statsFactory({cha: 55}),
            skill: skillFactory({stat: "CHA"})});
        expect(row.skillCheck()).toEqual(28);
    });

    it('can render skills which are available without cost', function () {
        var row = getSkillRow({
            skillName: "Acting / Bluff",
            stats: statsFactory({cha: 55}),
            skill: skillFactory({stat: "CHA", skill_cost_0: 0})});
        expect(row.skillCheck()).toEqual(55);
    });

    it('can find a skill check for a different stat', function () {
        var row = getSkillRow({
            characterSkill: characterSkillFactory({level: 1}),
            stats: statsFactory({cha: 45, wil: 60}),
            skill: skillFactory({stat: "CHA"})
        });
        expect(row.skillCheck("wil")).toEqual(65);
    });

    it('can render skill checks for multiple stats', function () {
        var row = getSkillRow({
            characterSkill: characterSkillFactory({
                skill: "Balance",
                level: 1}),
            stats: statsFactory({mov: 45, ref: 60}),
            skill: skillFactory({name: "Balance", stat: "MOV"}),
            renderForStats: ["mov", "ref"]
        });
        var cell = TestUtils.findRenderedDOMComponentWithClass(row,
            "skill-check");

        expect(cell.textContent).toContain("REF: 65");
        expect(cell.textContent).toContain("MOV: 50");
    });

    xit("shows skill with obsoleted skill level");
    xit("highlight skill with missing required skills");

    it('has controls to increase skill levels', function () {
        var spy = jasmine.createSpy("callback");
        var cs = characterSkillFactory({level: 1});
        var row = getSkillRow({
            characterSkill: cs,
            stats: statsFactory({cha: 45, wil: 60}),
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
            characterSkill: cs,
            stats: statsFactory({cha: 45, wil: 60}),
            skill: skillFactory({stat: "CHA"}),
            onCharacterSkillModify: spy
        });
        TestUtils.Simulate.click(ReactDOM.findDOMNode(row._decreaseButton))
        expect(spy).toHaveBeenCalledWith(Object.assign({}, cs, {level: 0}))
    });

    it('should not have a decrease control without a skill', function () {
        var spy = jasmine.createSpy("callback");
        var row = getSkillRow({
            characterSkill: undefined,
            stats: statsFactory({cha: 45, wil: 60}),
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
            characterSkill: cs,
            stats: statsFactory({cha: 45, wil: 60}),
            skill: skillFactory({stat: "CHA", min_level: 1}),
            onCharacterSkillModify: spy
        });
        expect('_decreaseButton' in row).toEqual(false);
    });

    it('should not have a increase control without a skill', function () {
        var spy = jasmine.createSpy("callback");
        var row = getSkillRow({
            characterSkill: undefined,
            stats: statsFactory({cha: 45, wil: 60}),
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
            characterSkill: cs,
            stats: statsFactory({cha: 45, wil: 60}),
            skill: skillFactory({stat: "CHA", max_level: 3}),
            onCharacterSkillModify: spy
        });
        expect('_increaseButton' in row).toEqual(false);
    });

    it("does not render missing skills if there are none", function () {
        var cs = characterSkillFactory({level: 3});
        var row = getSkillRow({
            characterSkill: cs,
            stats: statsFactory({cha: 45, wil: 60}),
            skill: skillFactory({stat: "CHA", max_level: 3}),
        });
        var node = ReactDOM.findDOMNode(row);
        expect(node.getAttribute('title')).toEqual('');
    });

    it("renders missing skills", function () {
        var cs = characterSkillFactory({level: 3});
        cs._missingRequired = ["Frozzling"];
        var row = getSkillRow({
            characterSkill: cs,
            stats: statsFactory({cha: 45, wil: 60}),
            skill: skillFactory({stat: "CHA", max_level: 3}),
        });
        var node = ReactDOM.findDOMNode(row);
        expect(node.getAttribute('title')).toMatch("Missing skill Frozzling");
    });

    it("renders missing skills with correct grammar", function () {
        var cs = characterSkillFactory({level: 3});
        cs._missingRequired = ["Frozzling", "Foobying"];
        var row = getSkillRow({
            characterSkill: cs,
            stats: statsFactory({cha: 45, wil: 60}),
            skill: skillFactory({stat: "CHA", max_level: 3}),
        });
        var node = ReactDOM.findDOMNode(row);
        expect(node.getAttribute('title')).toMatch("Missing skills" +
            " Frozzling, Foobying");
    })

});