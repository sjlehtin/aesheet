import React from 'react';
import ReactDOM from 'react-dom';
import TestUtils from 'react-addons-test-utils';

const FirearmControl = require('../FirearmControl').default;
const SkillTable = require('../SkillTable').default;
const SkillHandler = require('../SkillHandler').default;

const factories = require('./factories');

describe('FirearmControl', function() {
    "use strict";

    const getFirearmControl = factories.firearmControlTreeFactory;

    it("can calculate single fire skill checks", () => {
        const firearm = getFirearmControl();
        expect(firearm.skillCheck()).toEqual(11);
    });

    it("can calculate effect of missing specialization skill checks", () => {
        const firearm = getFirearmControl({
            handlerProps: {
                skills: [{
                    skill: "Handguns",
                    level: 1
                }]
            },
            weapon: factories.firearmFactory({base: {base_skill: "Handguns", skill: "Pistol"}})});
        expect(firearm.skillCheck()).toEqual(40);
    });

    it("notices specializations", function () {
        var firearm = getFirearmControl({
            handlerProps: {
                skills: [{
                    skill: "Pistol",
                    level: 1
                },
                {
                    skill: "Handguns",
                    level: 1
                }]
            },
            weapon: factories.firearmFactory({base: {base_skill: "Handguns", skill: "Pistol"}})});
        expect(firearm.skillCheck()).toEqual(50);
    });

    it ("calculates correct ROF", function() {
        var firearm = getFirearmControl({
            handlerProps: {
                skills: [{
                    skill: "Pistol",
                    level: 0
                }]},
            weapon: factories.firearmFactory({base: {base_skill: "Pistol"}})
        });
        expect(firearm.rof()).toBeCloseTo(2.86, 2);
    });

    it ("calculates correct ROF for higher skill level", function() {
        var firearm = getFirearmControl({
            handlerProps: {
                skills: [{
                    skill: "Pistol",
                    level: 3
                }]},
            weapon: factories.firearmFactory({base: {base_skill: "Pistol"}})
        });
        expect(firearm.rof()).toBeCloseTo(3.72, 2);
    });

    it ("can calculate a row of checks", function() {
        var firearm = getFirearmControl({
            handlerProps: {
                skills: [{
                    skill: "Pistol",
                    level: 0
                }]},
            weapon: factories.firearmFactory({base: {base_skill: "Pistol"}})
        });
        expect(firearm.skillChecks([0.5, 1, 2, 3, 4, 5, 6, 7, 8, 9]))
            .toEqual([55, 48, 45, 39, 32, 25, null, null, null, null]);
    });

    it ("takes into account penalties countered", function() {
        var firearm = getFirearmControl({
            handlerProps: {
                skills: [{
                    skill: "Pistol",
                    level: 0
                }],
                character: {cur_int: 45, cur_ref: 45, cur_fit: 63}
            },
            weapon: factories.firearmFactory({base: {base_skill: "Pistol"}})
        });
        expect(firearm.skillChecks([0.5, 1, 2, 3, 4, 5, 6, 7, 8, 9]))
            .toEqual([55, 48, 45, 45, 38, 31, null, null, null, null]);
    });

    it ("can calculate a row of initiatives", function() {
        var firearm = getFirearmControl({
            handlerProps: {
                character: {cur_int: 45, cur_ref: 45, cur_fit: 45,
                    cur_psy: 45},
                skills: [{
                    skill: "Pistol",
                    level: 0
                }]},
            weapon: factories.firearmFactory({base: {base_skill: "Pistol"}})
        });
        expect(firearm.initiatives([0.5, 1, 2, 3, 4, 5, 6, 7, 8, 9]))
            .toEqual([8, 6, 1, -4, 5, -1, null, null, null, null]);
    });


    it ("can render damage", function() {
        var firearm = getFirearmControl({
            weapon: factories.firearmFactory({ammo: {num_dice: 2,
                dice: 6,
                leth: 6,
                extra_damage: 3,
                plus_leth: -1}})
        });
        expect(ReactDOM.findDOMNode(firearm).querySelector('.damage')
            .textContent).toEqual("2d6+3/6 (-1)");
    });

    var getBurstController = function (givenProps) {
        var props = {
            fit: 45,
            hasAutofireSkill: true,
            autofireRPM: 600
        };
        if (givenProps) {
            props = Object.assign(props, givenProps);
        }
        var skills = [
            {
                skill: "Long guns",
                level: 0
            }
        ];

        if (props.hasAutofireSkill) {
            skills.push({
                        skill: "Autofire",
                        level: 0});
        }
        return getFirearmControl({
            handlerProps: {
                skills: skills,
                character: {cur_ref: 45, cur_int: 45, cur_psy: 45,
                    cur_fit: props.fit}
            },
            weapon: factories.firearmFactory({
            base: {name: "Invented",
                autofire_rpm: props.autofireRPM,
                autofire_class: "B",
                sweep_fire_disabled: props.sweepFireDisabled,
                restricted_burst_rounds: props.restrictedBurstRounds,
                base_skill: "Long guns"
            }
        })});
    };

    it ("can calculate burst fire checks", function () {
        var firearm = getBurstController();
        var checks = firearm.burstChecks([2]);
        expect(checks.length).toEqual(1);
        expect(checks[0].length).toEqual(5);
        expect(checks[0]).toEqual([39, 37, 33, 27, 19]);
    });

    it ("can calculate burst fire checks for high FIT", function () {
        var firearm =  getBurstController({fit: 66});
        var checks = firearm.burstChecks([2]);
        expect(checks.length).toEqual(1);
        expect(checks[0].length).toEqual(5);
        expect(checks[0]).toEqual([45, 44, 40, 34, 26]);
    });

    it ("does not negate bonus from low action count in bursts", function () {
        var firearm =  getBurstController({fit: 66});
        var checks = firearm.burstChecks([1]);
        expect(checks.length).toEqual(1);
        expect(checks[0].length).toEqual(5);
        expect(checks[0]).toEqual([48, 48, 48, 43, 35]);
    });

    it ("takes missing Autofire skill into account", function () {
        var firearm =  getBurstController({fit: 66, hasAutofireSkill: false});
        var checks = firearm.burstChecks([1]);
        expect(checks.length).toEqual(1);
        expect(checks[0].length).toEqual(5);
        expect(checks[0]).toEqual([38, 38, 38, 33, 25]);
    });

    it ("takes low RPM into account", function () {
        var firearm = getBurstController({autofireRPM: 400});
        var checks = firearm.burstChecks([2]);
        expect(checks.length).toEqual(1);
        expect(checks[0].length).toEqual(5);
        expect(checks[0]).toEqual([39, 37, 33, null, null]);
    });

    it ("takes restricted bursts into account", function () {
        var firearm = getBurstController({restrictedBurstRounds: 3});
        var checks = firearm.burstChecks([2]);
        expect(checks.length).toEqual(1);
        expect(checks[0].length).toEqual(5);
        expect(checks[0]).toEqual([39, 37, 33, null, null]);
    });

    it ("can render sweep fire", function () {
        var firearm = getBurstController();
        var checks = firearm.sweepChecks(20);
        expect(checks.length).toEqual(16);
        expect(checks).toEqual([55, 53, 51, 49, 45, 41, 37, 33, 23, 13, 3,
            -7, -27, -47, -67, -87]);
    });

    it ("does not render sweep fire if it is disabled", function () {
        var firearm = getBurstController({sweepFireDisabled: true});
        var table = firearm.renderSweepTable();
        expect(table).toEqual('');
    });

    it ("takes missing Autofire skill into account in sweep fire", function () {
        var firearm = getBurstController({hasAutofireSkill: false});
        var checks = firearm.sweepChecks(20);
        expect(checks.length).toEqual(16);
        expect(checks).toEqual([45, 43, 41, 39, 35, 31, 27, 23, 13, 3, -7,
            -17, -37, -57, -77, -97]);
    });

    it ("counters sweep fire penalties with high FIT", function () {
        var firearm = getBurstController({fit: 72});
        var checks = firearm.sweepChecks(10);
        expect(checks.length).toEqual(8);
        expect(checks).toEqual([45, 45, 45, 44, 34, 24, 4, -16]);
    });

    it ("allows removal of the firearm", function () {
        var spy = jasmine.createSpy("callback");
        var firearm = getFirearmControl({
            weapon: factories.firearmFactory({id: 5}),
            onRemove: spy
        });
        TestUtils.Simulate.click(ReactDOM.findDOMNode(firearm._removeButton));
        expect(spy).toHaveBeenCalledWith({id: 5});
    });

});