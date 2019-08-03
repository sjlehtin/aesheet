jest.dontMock('../SkillTable');
jest.dontMock('../SkillHandler');
jest.dontMock('../SkillRow');
jest.dontMock('../AddSkillControl');
jest.dontMock('../sheet-util');
jest.dontMock('./factories');

import React from 'react';
import ReactDOM from 'react-dom';
import TestUtils from 'react-dom/test-utils';

import SkillTable from '../SkillTable';

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
        var props = {};
        if (givenProps) {
            props = Object.assign(props, givenProps);
        }

        var allSkills = _basicPhysical;
        if (props.allSkills) {
            allSkills = allSkills.concat(props.allSkills);
        }
        props.allSkills = allSkills;

        var skillHandler = factories.skillHandlerFactory(props);
        var table = TestUtils.renderIntoDocument(
            <SkillTable skillHandler={skillHandler}
                        onCharacterSkillAdd={props.onCharacterSkillAdd}
                        onCharacterSkillModify={props.onCharacterSkillModify}
                        onCharacterSkillRemove={props.onCharacterSkillRemove}
            />
        );

        return TestUtils.findRenderedComponentWithType(table,
            SkillTable);
    };

    it('renders as empty', function () {
        var table = getSkillTable();
        expect(typeof(table)).toEqual("object");
    });

    var getSkillList = function (skillTable) {
        var rows = Array.prototype.slice.call(ReactDOM.findDOMNode(skillTable).querySelector('tbody').querySelectorAll('tr'));
        return rows.map((row) => {
            var node = row.querySelectorAll('td span')[0];

            return node.textContent;
        })
    };

    var findSkillRows = function (skillTable, skillName) {
        var returnRows = [];
        var rows = ReactDOM.findDOMNode(skillTable).querySelector('tbody').querySelectorAll('tr');
        for (var ii = 0; ii < rows.length; ii++) {
            var row = rows[ii];
            if (row.querySelectorAll('td span')[0].textContent === skillName) {
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
        return cells[1].querySelector('span').textContent;
    };
    
    var getSkillCheck = function (cells) {
        return cells[3].textContent;
    };
    
    it("starts with a good set of physical skills", function () {
        var table = getSkillTable({
            character: {cur_int: 50}});
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
        expect(row).not.toBe(undefined);
        expect(row.length).not.toEqual(0);

        var cells = row.querySelectorAll('td');

        expect(getSkillLevel(cells)).toEqual('0');
        expect(getSkillCheck(cells)).toEqual('50');
    });

    it("does render all skills", function (){
        var table = getSkillTable({character: {cur_int: 50},
            allSkills: _basicPhysical.concat([
                {name: "Agriculture"}]),
            skills: [
                {skill: "Search", level: 1},
                {skill: "Agriculture", level: 3}
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
        var table = getSkillTable({character: {cur_int: 50},
            allSkills: _basicPhysical.concat([
                {name: "Search"}]),
            skills: [
                {skill: "Search", level: 1},
                {skill: "Agriculture", level: 3}
            ]});
        var newList = table.mangleSkillList();
        expect(newList.length).toEqual(1);
        expect(newList[0].skill).toEqual("Agriculture");
    });

    it("does not render same skill twice", function () {
        var table = getSkillTable({
            allSkills: _basicPhysical.concat([
                factories.skillFactory({name: "Agriculture"})]),
            skills: [
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



    // -> to skillrow.  Here we just pass the callbacks forward.
    xit("allows adding a physical skill level from the start set", test.todo);
    xit("allows increasing a skill level from the start set", test.todo);
    xit("allows removing skills", test.todo);

    xit("allows adding a new skill", test.todo);

    it("calls the passed onCharacterSkillModify handler", function () {
        let spy = jasmine.createSpy("callback");
        let table = getSkillTable({
            onCharacterSkillModify: spy
        });
        const data = {id: 2, level: 3, skill: "Gardening", character: 1};
        table.handleCharacterSkillModify(Object.assign({}, data));
        expect(spy).toHaveBeenCalledWith(data);
    });

    it("calls the passed onCharacterSkillRemove handler", function () {
        let spy = jasmine.createSpy("callback");
        let table = getSkillTable({
            onCharacterSkillRemove: spy
        });
        const data = {id: 2};
        table.handleCharacterSkillRemove(Object.assign({}, data));
        expect(spy).toHaveBeenCalledWith(data);
    });

    it("calls the passed onCharacterSkillAdd handler", function () {
        let spy = jasmine.createSpy("callback");
        let table = getSkillTable({
            onCharacterSkillAdd: spy
        });
        const data = {level: 3, skill: "Gardening", character: 1};
        table.handleCharacterSkillAdd(Object.assign({}, data));
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
        let table = getSkillTable({
            edges: [factories.edgeLevelFactory({extra_skill_points: 6}),
                factories.edgeLevelFactory({extra_skill_points: 8})
            ]
        });
        expect(table.edgeSkillPoints()).toEqual(14);
    });

    it("calculates starting SP", function () {
        let table = getSkillTable({character: {
            start_lrn: 50, start_int: 38, start_psy: 47}
        });
        expect(table.initialSkillPoints()).toEqual(30);
    });

    it("processes age SP", function () {
        let table = getSkillTable({character: {gained_sp: 23}});
        expect(table.earnedSkillPoints()).toEqual(23);
    });

    it("can give hints to optimize skill point accumulation", function () {
        let table = getSkillTable({character: {
            cur_lrn: 50, cur_int: 38, cur_psy: 47}
        });
        expect(table.optimizeAgeSP()).toEqual({lrn: 3, int: 0, psy: 1});
    });
});