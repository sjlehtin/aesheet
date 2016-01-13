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

    var findSkillRows = function (skillTable, skillName) {
        var returnRows = [];
        var rows = ReactDOM.findDOMNode(skillTable).querySelectorAll('tr');
        for (var ii = 0; ii < rows.length; ii++) {
            var row = rows[ii];
            if (row.querySelectorAll('td')[0].textContent === skillName) {
                returnRows.push(row)
            }
        }
        return returnRows;
    };

    var findSkillRow = function (skillTable, skillName) {
        var rows = findSkillRows(skillTable, skillName);
        expect(rows.length).toEqual(1);
        return rows[0];
    };

    var getSkillLevel = function (cells) {
        return cells[1].textContent;
    };
    
    var getSkillCheck = function (cells) {
        return cells[2].textContent;
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
        
        expect(getSkillLevel(cells)).toEqual('0');
        expect(getSkillCheck(cells)).toEqual('50');
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

    it("does render all skills", function (){
        var table = getSkillTable({stats:
            factories.statsFactory({"int": 50}),
            allSkills: _basicPhysical.concat([
                factories.skillFactory({name: "Agriculture"})]),
            characterSkills: [
                factories.characterSkillFactory({skill: "Search", level: 1}),
                factories.characterSkillFactory(
                    {skill: "Agriculture", level: 3})
            ]});
        // the basic physical skills + Agriculture.
        // expect(getSkillList(table).length).toEqual(10);
       
        var searchRow = findSkillRows(table, "Search")[0];
        var searchCells = searchRow.querySelectorAll('td');
        
        expect(getSkillLevel(searchCells)).toEqual('1');
        
        var agricultureRow = findSkillRow(table, "Agriculture");
        var agricultureCells = agricultureRow.querySelectorAll('td');
        
        expect(getSkillLevel(agricultureCells)).toEqual('3');
    });

    it("mangles skill list to remove physical prefilled skills", function () {
        var skillList = [
            factories.characterSkillFactory({skill: "Search", level: 1}),
            factories.characterSkillFactory(
                {skill: "Agriculture", level: 3})
        ];
        var newList = SkillTable.mangleSkillList(skillList, [
            factories.skillFactory({name: "Search"}),
            factories.skillFactory({name: "Agriculture"}),
        ]);
        expect(newList.length).toEqual(1);
        expect(newList[0].skill).toEqual("Agriculture");
    });

    it("does not render same skill twice", function () {
        var table = getSkillTable({stats:
            factories.statsFactory({"int": 50}),
            allSkills: _basicPhysical.concat([
                factories.skillFactory({name: "Agriculture"})]),
            characterSkills: [
                factories.characterSkillFactory({skill: "Search", level: 1}),
                factories.characterSkillFactory(
                    {skill: "Agriculture", level: 3})
            ]});
        // the basic physical skills + Agriculture.
        expect(getSkillList(table).length).toEqual(10);
        var searchRow = findSkillRow(table, "Search");
        var searchCells = searchRow.querySelectorAll('td');

        expect(getSkillLevel(searchCells)).toEqual('1');
    });

    it("mangles skill list to respect requirements order", function () {
        var skillList = [
            factories.characterSkillFactory(
                {skill: "Naval Gunnery", level: 1}),
            factories.characterSkillFactory(
                {skill: "Basic Artillery", level: 0}),
            factories.characterSkillFactory(
                {skill: "Agriculture", level: 3})
        ];
        var allSkills = [factories.skillFactory({name: "Agriculture"}),
            factories.skillFactory({name: "Basic Artillery"}),
            factories.skillFactory({name: "Naval Gunnery",
                required_skills: ["Basic Artillery"]})
        ];

        var newList = SkillTable.mangleSkillList(skillList, allSkills);
        expect(newList[0].skill).toEqual("Agriculture");
    });

    it("finds missing skills while mangling from all requires", function () {
        var skillList = [
            factories.characterSkillFactory(
                {skill: "Naval Gunnery", level: 1}),
            factories.characterSkillFactory(
                {skill: "Basic Artillery", level: 0}),
            factories.characterSkillFactory(
                {skill: "Agriculture", level: 3})
        ];
        var allSkills = [factories.skillFactory({name: "Agriculture"}),
            factories.skillFactory({name: "Basic Artillery"}),
            factories.skillFactory({name: "Naval Gunnery",
                required_skills: ["Basic Artillery", "Gardening"]})
        ];

        var newList = SkillTable.mangleSkillList(skillList, allSkills);
        expect(newList[2].skill).toEqual("Naval Gunnery");
        expect(newList[2].missingRequired).toEqual(["Gardening"]);
    });

    it("finds missing skills while mangling", function () {
        var skillList = [
            factories.characterSkillFactory(
                {skill: "Florism", level: 1}),
            factories.characterSkillFactory(
                {skill: "Basic Artillery", level: 0}),
            factories.characterSkillFactory(
                {skill: "Agriculture", level: 3})
        ];
        var allSkills = [factories.skillFactory({name: "Agriculture"}),
            factories.skillFactory({name: "Basic Artillery"}),
            factories.skillFactory({name: "Florism",
                required_skills: ["Gardening"]})
        ];

        var newList = SkillTable.mangleSkillList(skillList, allSkills);
        expect(newList[2].skill).toEqual("Florism");
        expect(newList[2].missingRequired).toEqual(["Gardening"]);
    });

    it("calculates indent for nested required skills while mangling", function () {
        var skillList = [
            factories.characterSkillFactory(
                {skill: "Florism", level: 1}),
            factories.characterSkillFactory(
                {skill: "Gardening", level: 0}),
            factories.characterSkillFactory(
                {skill: "Agriculture", level: 3})
        ];
        var allSkills = [factories.skillFactory({name: "Agriculture"}),
            factories.skillFactory({name: "Gardening",
                required_skills: ["Agriculture"]}),
            factories.skillFactory({name: "Florism",
                required_skills: ["Gardening"]})
        ];

        var newList = SkillTable.mangleSkillList(skillList, allSkills);
        expect(newList[0].skill).toEqual("Agriculture");
        expect(newList[0].indent).toEqual(0);
        expect(newList[1].indent).toEqual(1);
        expect(newList[2].skill).toEqual("Florism");
        expect(newList[2].indent).toEqual(2);
    });

    it("does not choke on multiple required skills", function () {
        var skillList = [
            factories.characterSkillFactory(
                {skill: "Florism", level: 1}),
            factories.characterSkillFactory(
                {skill: "Aesthetism", level: 0}),
            factories.characterSkillFactory(
                {skill: "Gardening", level: 0}),
            factories.characterSkillFactory(
                {skill: "Agriculture", level: 3})
        ];
        var allSkills = [factories.skillFactory({name: "Agriculture"}),
            factories.skillFactory({name: "Gardening",
                required_skills: ["Agriculture"]}),
            factories.skillFactory({name: "Florism",
                required_skills: ["Gardening", "Aesthetism"]}),
            factories.skillFactory({name: "Aesthetism"})
        ];

        var newList = SkillTable.mangleSkillList(skillList, allSkills);
        expect(newList[0].skill).toEqual("Aesthetism");
        expect(newList[0].indent).toEqual(0);
        expect(newList[1].skill).toEqual("Agriculture");
        expect(newList[1].indent).toEqual(0);
        expect(newList[2].indent).toEqual(1);
        expect(newList[3].skill).toEqual("Florism");
        expect(newList[3].indent).toEqual(2);
    });

    xit("does not choke on multiple required skills");

    xit("allows adding a physical skill level from the start set");
    xit("allows increasing a skill level from the start set");
    xit("allows removing skills");
    xit("allows adding a new skill");
    xit("allows browsing through non-language and language skills" +
        " separately");

});