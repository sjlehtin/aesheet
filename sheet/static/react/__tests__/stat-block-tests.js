jest.dontMock('../StatBlock');
jest.dontMock('../StatRow');
jest.dontMock('../XPControl');

import React from 'react';
import ReactDOM from 'react-dom';
import TestUtils from 'react-addons-test-utils';

var rest = require('sheet-rest');

const StatBlock = require('../StatBlock').default;

describe('stat block', function() {
    "use strict";

    var promises;

    var charDataFactory = function (statOverrides) {
        var _charData = {
            id: 2,

            "cur_fit": 40,
            "cur_ref": 60,
            "cur_lrn": 43,
            "cur_int": 43,
            "cur_psy": 50,
            "cur_wil": 43,
            "cur_cha": 43,
            "cur_pos": 43,

            "mod_fit": 0,
            "mod_ref": 0,
            "mod_lrn": 0,
            "mod_int": 0,
            "mod_psy": 0,
            "mod_wil": 0,
            "mod_cha": 0,
            "mod_pos": 0,
            "mod_mov": 0,
            "mod_dex": 0,
            "mod_imm": 0,
            bought_mana: 0,
            bought_stamina: 0
        };

        return Object.assign(_charData, statOverrides);
    };

    var sheetDataFactory = function (statOverrides) {
        var _sheetData = {
            id: 1,
            character: 2,
            "weight_carried": "0.00",
            "mod_fit": 20,
            "mod_ref": 0,
            "mod_lrn": 0,
            "mod_int": 0,
            "mod_psy": 0,
            "mod_wil": 0,
            "mod_cha": 0,
            "mod_pos": 0,
            "mod_mov": 0,
            "mod_dex": 0,
            "mod_imm": 0
        };

        return Object.assign(_sheetData, statOverrides);
    };

    var edgeFactory = function (statOverrides) {
        var _edgeLevelData = {
            "id": 1,
            "notes": "",
            "cc_skill_levels": 0,
            "fit": 0,
            "ref": 0,
            "lrn": 0,
            "int": 0,
            "psy": 0,
            "wil": 0,
            "cha": 0,
            "pos": 0,
            "mov": 0,
            "dex": 0,
            "imm": 0,
            "saves_vs_fire": 0,
            "saves_vs_cold": 0,
            "saves_vs_lightning": 0,
            "saves_vs_poison": 0,
            "saves_vs_all": 0,
            "run_multiplier": "0.00",
            "swim_multiplier": "0.00",
            "climb_multiplier": "0.00",
            "fly_multiplier": "0.00",
            "level": 1,
            "cost": "2.0",
            "requires_hero": false,
            "edge": "Toughness",
            "skill_bonuses": []
        };
        return Object.assign(_edgeLevelData, statOverrides);
    };

    var jsonResponse = function (json) {
        var promise = Promise.resolve(json);
        promises.push(promise);
        return promise;
    };

    var getStatBlock = function (charData, sheetData) {
        rest.getData.mockImplementation(function (url) {
            if (url === "/rest/sheets/1/") {
                return jsonResponse(sheetData);
            } else if (url === "/rest/characters/2/") {
                return jsonResponse(charData);
            } else {
                /* Throwing errors here do not cancel the test. */
                fail("this is an unsupported url:" + url);
            }
        });
        var table = TestUtils.renderIntoDocument(
            <StatBlock url="/rest/sheets/1/"/>
        );

        return TestUtils.findRenderedComponentWithType(table,
            StatBlock);
    };

    beforeEach(function () {
        rest.getData = jest.genMockFunction();
        rest.patch = jest.genMockFunction();
        promises = [];
    });

    it('fetched initial data', function (done) {
        var block = getStatBlock(charDataFactory(), sheetDataFactory());
        expect(block.state.char).toBe(undefined);

        Promise.all(promises).then(function () {
            expect(block.state.sheet).not.toBe(undefined);
            expect(block.state.url).not.toBe(undefined);
            expect(rest.getData.mock.calls[0][0]).toEqual('/rest/sheets/1/');

            Promise.all(promises).then(function () {
                expect(rest.getData.mock.calls[1][0])
                    .toEqual('/rest/characters/2/');

                Promise.all(promises).then(function () {
                    /* TODO: Ridiculoso! */
                    expect(block.state.char).not.toBe(undefined);
                    done();
                });
            }).catch(function (err) {
                throw Error(err);
            });
        }).catch(function (err) {
            throw Error(err);
        });
    });


    var afterLoad = function (callback) {
        Promise.all(promises).then(function () {
            Promise.all(promises).then(function () {
                Promise.all(promises).then(function () {
                    callback()
                }).catch(function (err) { fail("failed with " + err)});
            });
        });
    };

    it('calculates MOV', function (done) {
        var block = getStatBlock(charDataFactory(), sheetDataFactory());

        afterLoad(function () {
            expect(block.baseMOV()).toEqual(50);
            expect(block.effMOV()).toEqual(60);
            done();
        });
    });

    it('calculates DEX', function (done) {
        var block = getStatBlock(charDataFactory(), sheetDataFactory());

        afterLoad(function () {
            expect(block.baseDEX()).toEqual(52);
            expect(block.effDEX()).toEqual(52);
            done();
        });
    });

    it('calculates IMM', function (done) {
        var block = getStatBlock(charDataFactory(), sheetDataFactory());

        afterLoad(function () {
            expect(block.baseIMM()).toEqual(45);
            expect(block.effIMM()).toEqual(45);
            done();
        });
    });

    it('calculates stamina', function (done) {
        var block = getStatBlock(charDataFactory(), sheetDataFactory());

        afterLoad(function () {
            expect(block.stamina()).toEqual(26);
            done();
        });
    });

    it('calculates stamina with bought stamina', function (done) {
        var block = getStatBlock(charDataFactory({bought_stamina: 5}),
            sheetDataFactory());

        afterLoad(function () {
            expect(block.stamina()).toEqual(31);
            done();
        });
    });

    it('calculates mana', function (done) {
        var block = getStatBlock(charDataFactory(), sheetDataFactory());

        afterLoad(function () {
            expect(block.mana()).toEqual(24);
            done();
        });
    });

    it('calculates mana with bought mana', function (done) {
        var block = getStatBlock(charDataFactory({bought_mana: 5}),
            sheetDataFactory());

        afterLoad(function () {
            expect(block.mana()).toEqual(29);
            done();
        });
    });

    it('calculates body upwards', function (done) {
        var block = getStatBlock(charDataFactory({cur_fit: 41}),
            sheetDataFactory());
        afterLoad(function () {
            expect(block.baseBody()).toEqual(11);
            done();
        });
    });

    it('calculates body', function (done) {
        var block = getStatBlock(charDataFactory({cur_fit: 39}),
            sheetDataFactory());
        afterLoad(function () {
            expect(block.baseBody()).toEqual(10);
            done();
        });
    });

    it('handles edge addition', function (done) {
        var block = getStatBlock(charDataFactory(), sheetDataFactory());
        afterLoad(function () {
            block.handleEdgeAdded(edgeFactory({"Toughness": 2}));
            expect(Object.keys(block.state.edges).length).toBe(1);
            expect(block.state.edges.Toughness).not.toBe(undefined);
            done();
        });
    });

    xit('handles edge removal');

    it('can indicate toughness', function (done) {
        var block = getStatBlock(charDataFactory({cur_fit: 40}),
            sheetDataFactory());
        afterLoad(function () {
            expect(block.toughness()).toEqual(0);
            block.handleEdgeAdded(edgeFactory({"Toughness": 1}));
            expect(block.toughness()).toEqual(1);
            expect(block.baseBody()).toEqual(10);
            done();
        });
    });

    it('can indicate stamina recovery', function (done) {
        var block = getStatBlock(charDataFactory(),
            sheetDataFactory());
        afterLoad(function () {
            block.handleEdgeAdded(edgeFactory({edge: "Fast Healing",
                level: 1}));
            expect(block.staminaRecovery()).toEqual('1d6/8h');
            block.handleEdgeAdded(edgeFactory({edge: "Fast Healing",
                level: 2}));
            expect(block.staminaRecovery()).toEqual('2d6/8h');
            block.handleEdgeAdded(edgeFactory({edge: "Fast Healing",
                level: 3}));
            expect(block.staminaRecovery()).toEqual('4d6/8h');
            done();
        });
    });

    it('can indicate stamina recovery with high stat', function (done) {
        var block = getStatBlock(charDataFactory({cur_fit: 75}),
            sheetDataFactory());
        afterLoad(function () {
            expect(block.staminaRecovery()).toEqual('1/8h');
            block.handleEdgeAdded(edgeFactory({edge: "Fast Healing",
                level: 1}));
            expect(block.staminaRecovery()).toEqual('1+1d6/8h');
            done();
        });
    });

    it('can indicate mana recovery', function (done) {
        var block = getStatBlock(charDataFactory(),
            sheetDataFactory());
        afterLoad(function () {
            block.handleEdgeAdded(edgeFactory({edge: "Fast Mana Recovery",
                level: 1}));
            expect(block.manaRecovery()).toEqual('2d6/8h');
            block.handleEdgeAdded(edgeFactory({edge: "Fast Mana Recovery",
                level: 2}));
            expect(block.manaRecovery()).toEqual('4d6/8h');
            block.handleEdgeAdded(edgeFactory({edge: "Fast Mana Recovery",
                level: 3}));
            expect(block.manaRecovery()).toEqual('8d6/8h');
            done();
        });
    });

    it('can indicate mana recovery with high stat', function (done) {
        var block = getStatBlock(charDataFactory({cur_cha: 70}),
            sheetDataFactory());
        afterLoad(function () {
            expect(block.manaRecovery()).toEqual('2/8h');
            block.handleEdgeAdded(edgeFactory({edge: "Fast Mana Recovery",
                level: 1}));
            expect(block.manaRecovery()).toEqual('2+2d6/8h');
            done();
        });
    });

    it('can indicate body healing', function (done) {
        var block = getStatBlock(charDataFactory(),
            sheetDataFactory());
        afterLoad(function () {
            expect(block.bodyHealing()).toEqual('3/16d');
            block.handleEdgeAdded(edgeFactory({edge: "Fast Healing",
                level: 3}));
            expect(block.bodyHealing()).toEqual('3/2d');
            done();
        });
    });

    it('handles modifications of stats from child components', function (done) {
        var block = getStatBlock(charDataFactory(), sheetDataFactory());
        afterLoad(function () {
            block.handleModification("fit", 40, 41);
            expect(block.baseMOV()).toEqual(51);
            done();
        });
    });

    it('handles modifications of xp from child components', function (done) {
        var block = getStatBlock(charDataFactory(), sheetDataFactory());
        afterLoad(function () {
            block.handleXPMod("total_xp", 0, 231);
            expect(block.state.char.total_xp).toEqual(231);
            done();
        });
    });

});
