jest.dontMock('../SkillTable');
jest.dontMock('../SkillRow');
jest.dontMock('../sheet-util');
jest.dontMock('./factories');

import React from 'react';
import ReactDOM from 'react-dom';
import TestUtils from 'react-addons-test-utils';

const SkillTable = require('../SkillTable').default;

var factories = require('./factories');

describe('SkillTable', function() {
    "use strict";

    var _basicPhysical = [
        factories.skillFactory({name: "Endurance / run",
            stat: "WIL", skill_cost_0: 0}),
        factories.skillFactory({name: "Balance",
            stat: "MOV", skill_cost_0: 0}),
        factories.skillFactory({name: "Stealth"}),
        factories.skillFactory({name: "Concealment"}),
        factories.skillFactory({name: "Search",
            stat: "INT", skill_cost_0: 0}),
        factories.skillFactory({name: "Climbing"}),
        factories.skillFactory({name: "Swimming"}),
        factories.skillFactory({name: "Jump"}),
        factories.skillFactory({name: "Sleight of hand"})
    ];

    var getSkillTable = function (givenProps) {
        var props = {allSkills: _basicPhysical,
            characterSkills: [],
            stats: factories.statsFactory()
        };
        if (typeof(givenProps) !== "undefined") {
            props = Object.assign(props, givenProps);
        }
        var table = TestUtils.renderIntoDocument(
            <SkillTable {...props}/>
        );

        return TestUtils.findRenderedComponentWithType(table,
            SkillTable);
    };

    it('renders as empty', function () {
        var table = getSkillTable();
        expect(typeof(table)).not.toEqual("undefined");
    });

    var getSkillList = function (skillTable) {
        var rows = Array.prototype.slice.call(ReactDOM.findDOMNode(skillTable).querySelectorAll('tr'));
        return rows.map((row) => {
            return row.querySelectorAll('td')[0].textContent; })
    };

    var findSkillRow = function (skillTable, skillName) {
        var rows = ReactDOM.findDOMNode(skillTable).querySelectorAll('tr');
        for (var ii = 0; ii < rows.length; ii++) {
            var row = rows[ii];
            if (row.querySelectorAll('td')[0].textContent === skillName) {
                return row;
            }
        }
    };

    it("starts with a good set of physical skills", function () {
        var table = getSkillTable({
            stats: factories.statsFactory({"int": 50})});
        var expectedSkills = ["Endurance / run",
            "Balance",
            "Stealth",
            "Concealment",
            "Search",
            "Climbing",
            "Swimming",
            "Jump",
            "Sleight of hand"
        ];
        expect(getSkillList(table).slice(0, 9)).toEqual(expectedSkills);
        var row = findSkillRow(table, "Search");
        var cells = row.querySelectorAll('td');
        // Skill level.
        expect(cells[1].textContent).toEqual('0');
        // Skill check.
        expect(cells[2].textContent).toEqual('50');
    });

    //it('finds skill', function () {
    //    var skill = skillFactory();
    //    var row = getSkillRow({
    //        characterSkill: characterSkillFactory(),
    //        stats: statsFactory(),
    //        skill: skill
    //    });
    //    expect(typeof(row)).not.toEqual("undefined");
    //    expect(row.findSkill()).toEqual(skill);
    //});

    xit("does render all skills");
    xit("does not render same skill twice");
    xit("allows adding a physical skill level from the start set");
    xit("allows increasing a skill level from the start set");
    xit("increasing normal skill level listings");
    xit("renders the skill level with child skills following their parents");
    xit("does not choke on multiple required skills");
    xit("allows removing skills");
    xit("allows adding a new skill");
    xit("allows browsing through non-language and language skills" +
        " separately");

});