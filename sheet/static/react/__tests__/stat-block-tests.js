jest.dontMock('../StatBlock');
jest.dontMock('../StatRow');

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
            "mod_imm": 0
        };

        return _charData;
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

        return _sheetData;
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
                expect(rest.getData.mock.calls[1][0]).toEqual('/rest/characters/2/');

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

    it('calculates MOV correctly', function (done) {
        var block = getStatBlock(charDataFactory(), sheetDataFactory());

        afterLoad(function () {
            expect(block.baseMOV()).toEqual(50);
            expect(block.effMOV()).toEqual(60);
            done();
        });
    });

    it('calculates DEX correctly', function (done) {
        var block = getStatBlock(charDataFactory(), sheetDataFactory());

        afterLoad(function () {
            expect(block.baseDEX()).toEqual(52);
            expect(block.effDEX()).toEqual(52);
            done();
        });
    });

    it('calculates IMM correctly', function (done) {
        var block = getStatBlock(charDataFactory(), sheetDataFactory());

        afterLoad(function () {
            expect(block.baseIMM()).toEqual(45);
            expect(block.effIMM()).toEqual(45);
            done();
        });
    });

    it('handles modifications from child components', function (done) {
        var block = getStatBlock(charDataFactory(), sheetDataFactory());
        afterLoad(function () {
            block.handleModification("fit", 40, 41);
            expect(block.baseMOV()).toEqual(51);
            done();
        });
    });
});
