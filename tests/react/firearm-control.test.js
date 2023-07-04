import React from 'react';
import ReactDOM from 'react-dom';
import TestUtils from 'react-dom/test-utils';

const FirearmControl = require('FirearmControl').default;
const SkillTable = require('SkillTable').default;
const SkillHandler = require('SkillHandler').default;

const factories = require('./factories');

jest.mock('sheet-rest');

describe('FirearmControl', () => {
    "use strict";

    it("can calculate single fire skill checks", () => {
        const firearm = factories.firearmControlTreeFactory();
        expect(firearm.skillCheck()).toEqual(11);
    });

    function rangeFirearm(givenProps) {

        let props = {
            base: {base_skill: "Handguns", skill: "Pistol"},
            handlerProps: {
                character: {cur_int: 50},
                skills: [{
                    skill: "Handguns",
                    level: 1
                }]
            },
            weapon: {base: {sight: 600, barrel_length: 602, accuracy: 1.0},
                scope: null,
            ammo: {
                num_dice: 2,
                dice: 6,
                extra_damage: 2,
                leth: 5,
                plus_leth: 1
            }}
        };
        if (givenProps) {
            if (typeof(givenProps.handlerProps) === "object") {
                props.handlerProps = Object.assign(props.handlerProps,
                    givenProps.handlerProps);
                delete givenProps.handlerProps;
            }
            if (typeof(givenProps.weapon) === "object") {
                props.weapon = Object.assign(props.weapon, givenProps.weapon);
                delete givenProps.weapon;
            }
            props = Object.assign(props, givenProps);
        }
        return factories.firearmControlTreeFactory(props);
    }

    it("can calculate contact range effects", () => {
        const firearm = rangeFirearm();
        let rangeEffect = firearm.weaponRangeEffect(0.4);
        expect(rangeEffect.check).toEqual(60);
        expect(rangeEffect.targetInitiative).toEqual(2);
        expect(rangeEffect.damage).toEqual(2);
        expect(rangeEffect.leth).toEqual(2);
        expect(rangeEffect.name).toEqual("Contact");
    });

    it("can calculate close range effects", () => {
        const firearm = rangeFirearm();
        let rangeEffect = firearm.weaponRangeEffect(1);
        expect(rangeEffect.check).toEqual(50);
        expect(rangeEffect.targetInitiative).toEqual(2);
        expect(rangeEffect.damage).toEqual(2);
        expect(rangeEffect.leth).toEqual(2);
        expect(rangeEffect.name).toEqual("Close");
    });

    it("can calculate point-blank range effects", () => {
        const firearm = rangeFirearm();
        let rangeEffect = firearm.weaponRangeEffect(3);
        expect(rangeEffect.check).toEqual(40);
        expect(rangeEffect.targetInitiative).toEqual(1);
        expect(rangeEffect.damage).toEqual(1);
        expect(rangeEffect.leth).toEqual(1);
        expect(rangeEffect.name).toEqual("Point-blank");
    });

    it("can calculate XXS range effects", () => {
        const firearm = rangeFirearm();
        let rangeEffect = firearm.weaponRangeEffect(7);
        expect(rangeEffect.check).toEqual(30);
        expect(rangeEffect.targetInitiative).toEqual(1);
        expect(rangeEffect.damage).toEqual(1);
        expect(rangeEffect.leth).toEqual(1);
        expect(rangeEffect.name).toEqual("XXS");
    });

    it("can calculate extra-short range effects", () => {
        const firearm = rangeFirearm();
        let rangeEffect = firearm.weaponRangeEffect(15);
        expect(rangeEffect.check).toEqual(20);
        expect(rangeEffect.targetInitiative).toEqual(0);
        expect(rangeEffect.damage).toEqual(0);
        expect(rangeEffect.leth).toEqual(0);
        expect(rangeEffect.name).toEqual("Extra-short");
    });

    it("can calculate very short range effects", () => {
        const firearm = rangeFirearm();
        let rangeEffect = firearm.weaponRangeEffect(30);
        expect(rangeEffect.check).toEqual(10);
        expect(rangeEffect.targetInitiative).toEqual(0);
        expect(rangeEffect.damage).toEqual(0);
        expect(rangeEffect.leth).toEqual(0);
        expect(rangeEffect.name).toEqual("Very short");
    });

    it("can calculate short range effects", () => {
        const firearm = rangeFirearm();
        let rangeEffect = firearm.weaponRangeEffect(60);
        expect(rangeEffect.check).toEqual(0);
        expect(rangeEffect.targetInitiative).toEqual(0);
        expect(rangeEffect.damage).toEqual(0);
        expect(rangeEffect.leth).toEqual(0);
        expect(rangeEffect.name).toEqual("Short");
    });

    it("can calculate medium range effects", () => {
        const firearm = rangeFirearm();
        let rangeEffect = firearm.weaponRangeEffect(61);
        expect(rangeEffect.check).toEqual(-10);
        expect(rangeEffect.targetInitiative).toEqual(0);
        expect(rangeEffect.damage).toEqual(0);
        expect(rangeEffect.leth).toEqual(0);
        expect(rangeEffect.name).toEqual("Medium");
    });

    it("can calculate long range effects", () => {
        const firearm = rangeFirearm();
        let rangeEffect = firearm.weaponRangeEffect(180);
        expect(rangeEffect.check).toEqual(-20);
        expect(rangeEffect.targetInitiative).toEqual(0);
        expect(rangeEffect.damage).toEqual(0);
        expect(rangeEffect.leth).toEqual(0);
        expect(rangeEffect.name).toEqual("Long");
    });

    it("can calculate extra long range effects", () => {
        const firearm = rangeFirearm();
        let rangeEffect = firearm.weaponRangeEffect(270);
        expect(rangeEffect.check).toEqual(-30);
        expect(rangeEffect.targetInitiative).toEqual(-1);
        expect(rangeEffect.damage).toEqual(-1);
        expect(rangeEffect.leth).toEqual(-1);
        expect(rangeEffect.name).toEqual("Extra-long");
    });

    it("can calculate XXL range effects", () => {
        const firearm = rangeFirearm();
        let rangeEffect = firearm.weaponRangeEffect(360);
        expect(rangeEffect.check).toEqual(-40);
        expect(rangeEffect.targetInitiative).toEqual(-2);
        expect(rangeEffect.damage).toEqual(-2);
        expect(rangeEffect.leth).toEqual(-2);
        expect(rangeEffect.name).toEqual("XXL");
    });

    it("can calculate instinctive fire", () => {
        const firearm = rangeFirearm({handlerProps: {
                skills: [{
                    skill: "Handguns",
                    level: 1
                }, {skill: "Instinctive fire", level: 2}],
                character: {cur_int: 50}
        }});
        expect(firearm.props.skillHandler.getStat("int")).toEqual(50);
        const rangeEffect = firearm.rangeEffect(25);
        expect(rangeEffect.targetInitiative).toEqual(2);
        expect(firearm.props.skillHandler.getStat("int")).toEqual(50);
    });

    it("recognizes INT for instinctive fire range", () => {
        const firearm = rangeFirearm({handlerProps: {
                skills: [{
                    skill: "Handguns",
                    level: 1
                }, {skill: "Instinctive fire", level: 2}],
                character: {cur_int: 50}
            }});
        const rangeEffect = firearm.rangeEffect(26);
        expect(rangeEffect.targetInitiative).toEqual(0);
    });

    it("does not use instinctive fire for default range", () => {
        const firearm = rangeFirearm({handlerProps: {
                skills: [{
                    skill: "Handguns",
                    level: 1
                }, {skill: "Instinctive fire", level: 2}],
                character: {cur_int: 50}
            }});
        const rangeEffect = firearm.rangeEffect("");
        expect(rangeEffect.targetInitiative).toEqual(0);
    });

    it("respects that Instinctive fire can only raise target-I up to zero", () => {
        const firearm = rangeFirearm({handlerProps: {
                skills: [{
                    skill: "Handguns",
                    level: 1
                }, {skill: "Instinctive fire", level: 2}],
                character: {cur_int: 50},
                weapon: {base: {sight: 600, barrel_length: 602, accuracy: 1.0,
                    target_initiative: -1},
                         scope: null}
        }, toRange: 25});
        expect(firearm.props.skillHandler.getStat("int")).toEqual(50);
        const rangeEffect = firearm.rangeEffect(25);
        expect(rangeEffect.targetInitiative).toEqual(2);
        expect(firearm.targetInitiative()).toEqual(0);
    });

    it("renders damage with XXL range effects", () => {
        const firearm = rangeFirearm({toRange: 360});
        expect(ReactDOM.findDOMNode(firearm).querySelector('.damage')
            .textContent).toEqual("2d6+0/3 (+1)");
    });

    it("renders damage with contact range effects", () => {
        const firearm = rangeFirearm({toRange: 0.3});
        expect(ReactDOM.findDOMNode(firearm).querySelector('.damage')
            .textContent).toEqual("2d6+4/7 (+1)");
    });

    it("can recognizes too long range", () => {
        const firearm = rangeFirearm();
        let rangeEffect = firearm.weaponRangeEffect(400);
        expect(rangeEffect).toBe(null);
    });

    it("renders even with impossible range", () => {
        const firearm = rangeFirearm({toRange: 20000});
        expect(ReactDOM.findDOMNode(firearm).querySelector('.damage')
            .textContent).toEqual("range too long!");
    });

    it("renders even with impossible range and burst capable weapon", () => {
        const firearm = rangeFirearm({weapon:
                {base: { autofire_rpm: 600, autofire_class: "C"}},
            toRange: 20000});
        expect(ReactDOM.findDOMNode(firearm).querySelector('.damage')
            .textContent).toEqual("range too long!");
    });

    it("can calculate XXL range effects and include effect of " +
        "vision penalty", () => {
        const firearm = rangeFirearm();
        let rangeEffect = firearm.rangeEffect(360);
        expect(rangeEffect.check).toEqual(-55);
        expect(rangeEffect.targetInitiative).toEqual(-2);
        expect(rangeEffect.bumpingAllowed).toBe(false);
        expect(rangeEffect.damage).toEqual(-2);
        expect(rangeEffect.leth).toEqual(-2);
        expect(rangeEffect.name).toEqual("XXL");
    });

    it("can calculate range effects and include effect of " +
        "darkness penalty", () => {
        const firearm = rangeFirearm({darknessDetectionLevel: -3});
        let rangeEffect = firearm.rangeEffect(360);
        expect(rangeEffect).toBe(null);

        rangeEffect = firearm.rangeEffect(100);
        expect(rangeEffect.check).toEqual(-65);
        expect(rangeEffect.targetInitiative).toEqual(0);
        expect(rangeEffect.bumpingAllowed).toBe(false);
        expect(rangeEffect.damage).toEqual(0);
        expect(rangeEffect.leth).toEqual(0);
        expect(rangeEffect.name).toEqual("Medium");
    });

    // it("can calculate bumping based on range", () => {
    //     const firearm = rangeFirearm();
    //     let rangeEffect = firearm.rangeEffect(25);
    //     expect(rangeEffect.check).toEqual(-10);
    //     expect(rangeEffect.targetInitiative).toEqual(0);
    //     // TODO: should be false
    //     //expect(rangeEffect.bumpingAllowed).toBe(true);
    // });

    // it("takes Acute Vision into account", () => {
    //     const firearm = rangeFirearm({handlerProps: {
    //         edges: [{edge: "Acute Vision", level: 2}]}});
    //     let rangeEffect = firearm.rangeEffect(360);
    //     // Acute vision 2 equals +1DL -> +10,
    //     // Acute vision 2 should lower range penalties by +10
    //     expect(rangeEffect.check).toEqual(-35);
    //     expect(rangeEffect.targetInitiative).toEqual(-2);
    // });

    // it("takes scope's Acute Vision into account", () => {
    //     const firearm = rangeFirearm();
    //     let rangeEffect = firearm.rangeEffect(25);
    //     expect(rangeEffect.check).toEqual(-10);
    //     expect(rangeEffect.targetInitiative).toEqual(0);
    //     // TODO: should be false
    //     //expect(rangeEffect.bumpingAllowed).toBe(true);
    //
    //     // there should be only one call to the skillHandler.visionCheck TODO: TBC
    // });

    // it('accounts for the Color blind flaw correctly in daylight', () => {
    //     const spy = jest.fn().mockReturnValue(Promise.resolve({}));
    //
    //     const control = factories.firearmControlTreeFactory({weapon:
    //         {id: 19,
    //             base: {name: "Nabu tussari"},
    //             scope: {name: "Test scope"}},
    //         onChange: spy
    //     });
    //     TestUtils.Simulate.click(ReactDOM.findDOMNode(control._scopeRemoveButton));
    //     expect(spy).toBeCalledWith({id: 19, scope: null});
    // });
    //
    // it('ignores for the Color blind flaw correctly in night time', () => {
    // });


    it ("can calculate a row of checks to implicit short range", () => {
        const firearm = rangeFirearm();
        expect(firearm.skillChecks([0.5, 1, 2, 3, 4, 5, 6, 7, 8, 9]))
            .toEqual([62, 55, 52, 52, 42, 35, 29, null, null, null]);
    });

    it ("can calculate a row of checks to short range", () => {
        const firearm = rangeFirearm({toRange: 60});
        expect(firearm.skillChecks([0.5, 1, 2, 3, 4, 5, 6, 7, 8, 9]))
            .toEqual([62, 55, 52, 52, 42, 35, 29, null, null, null]);
    });

    it ("can calculate a row of checks to medium range", () => {
        const firearm = rangeFirearm({toRange: 61});
        expect(firearm.skillChecks([0.5, 1, 2, 3, 4, 5, 6, 7, 8, 9]))
            .toEqual([52, 45, 42, 42, 32, 25, 19, null, null, null]);
    });

    it ("can calculate a row of initiatives to short range", () => {
        const firearm = rangeFirearm({toRange: 60});
        expect(firearm.initiatives([0.5, 1, 2, 3, 4, 5, 6, 7, 8, 9]))
            .toEqual([8, 6, 2, -3, 5, 0, -5, null, null, null]);
    });

    it ("can calculate a row of initiatives to extra-long range", () => {
        const firearm = rangeFirearm({toRange: 181}); // 4.5 * 21
        expect(firearm.longRangeMultiplier()).toEqual(3);

        expect(firearm.initiatives([0.5, 1, 2, 3, 4, 5, 6, 7, 8, 9]))
            .toEqual([8, 5, 1, -4, 4, -1, -6, null, null, null]);
    });

    it("can calculate effect of missing specialization skill checks", () => {
        const firearm = factories.firearmControlTreeFactory({
            handlerProps: {
                skills: [{
                    skill: "Handguns",
                    level: 1
                }]
            },
            weapon: factories.firearmFactory({base: {base_skill: "Handguns", skill: "Pistol"}})});
        expect(firearm.skillCheck()).toEqual(40);
    });

    it("notices specializations", () => {
        const firearm = factories.firearmControlTreeFactory({
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

    it ("calculates range for pistols", function() {
        const firearm = factories.firearmControlTreeFactory({
            weapon: {base: {sight: 153, barrel_length: 102, accuracy: 1.0},
                     scope: null}
        });
        expect(firearm.shortRange()).toEqual(12);
    });

    it ("calculates scope into range", function() {
        const firearm = factories.firearmControlTreeFactory({
            weapon: {base: {sight: 153, barrel_length: 102, accuracy: 0.6},
            scope: {sight: 600}}
        });
        expect(firearm.shortRange()).toEqual(21);
    });

    it ("calculates scope into target initiative", function() {
        const firearm = factories.firearmControlTreeFactory({
            weapon: {base: {sight: 153, barrel_length: 102, accuracy: 0.6, target_initiative: -2},
            scope: {sight: 600, target_i_mod: -2}}
        });
        expect(firearm.targetInitiative()).toEqual(-4);
    });

    it ("does not use sight equal to zero from scope, only initiative", function() {
        const firearm = factories.firearmControlTreeFactory({
            weapon: {base: {sight: 153, barrel_length: 102, accuracy: 1.0, target_initiative: -2},
            scope: {sight: 0, target_i_mod: 1}}
        });
        expect(firearm.shortRange()).toEqual(12);
        expect(firearm.targetInitiative()).toEqual(-1);
    });


    it ("calculates range for assault rifles", function() {
        const firearm = factories.firearmControlTreeFactory({
            weapon: {base: {sight: 378, barrel_length: 415, accuracy: 1.0},
            scope: null}
        });
        expect(firearm.shortRange()).toEqual(39);
    });

    it ("calculates range for a good SMG", function() {
        const firearm = factories.firearmControlTreeFactory({
            weapon: {base: {sight: 340, barrel_length: 225, accuracy: 1.08},
                scope: null}
        });
        expect(firearm.shortRange()).toEqual(30);
    });

    it ("calculates long range multiplier for pistols", function() {
        const firearm = factories.firearmControlTreeFactory({
            weapon: {base: {stock: 1}, ammo: {velocity: 359}}
        });
        expect(firearm.longRangeMultiplier()).toEqual(3);
    });

    it ("calculates long range multiplier for assault rifles", function() {
        const firearm = factories.firearmControlTreeFactory({
            weapon: {base: {stock: 1.25}, ammo: {velocity: 715}}
        });
        expect(firearm.longRangeMultiplier()).toEqual(5);
    });

    it ("calculates long range multiplier for a sniper rifle", function() {
        const firearm = factories.firearmControlTreeFactory({
            weapon: {base: {stock: 1.50}, ammo: {velocity: 900}}
        });
        expect(firearm.longRangeMultiplier()).toEqual(6);
    });

    // it ("should indicate no penalty for short range", () => {
    //     const firearm = factories.firearmControlTreeFactory({
    //         handlerProps: {
    //             skills: [{
    //                 skill: "Pistol",
    //                 level: 0
    //             }]},
    //         weapon: factories.firearmFactory({base: {base_skill: "Pistol"}})
    //     });
    //     expect(firearm.rof()).toBeCloseTo(2.86, 2);
    // });

    it ("calculates correct ROF", () => {
        const firearm = factories.firearmControlTreeFactory({
            handlerProps: {
                skills: [{
                    skill: "Pistol",
                    level: 0
                }]},
            weapon: factories.firearmFactory({base: {base_skill: "Pistol"}})
        });
        expect(firearm.rof()).toBeCloseTo(2.86, 2);
    });

    it ("calculates correct ROF for higher skill level", () => {
        const firearm = factories.firearmControlTreeFactory({
            handlerProps: {
                skills: [{
                    skill: "Pistol",
                    level: 3
                }]},
            weapon: factories.firearmFactory({base: {base_skill: "Pistol"}})
        });
        expect(firearm.rof()).toBeCloseTo(3.72, 2);
    });

    it ("can calculate a row of checks", () => {
        const firearm = factories.firearmControlTreeFactory({
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

    it ("takes into account penalties countered", () => {
        const firearm = factories.firearmControlTreeFactory({
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

    it ("can calculate a row of initiatives", () => {
        const firearm = factories.firearmControlTreeFactory({
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


    it ("can render damage", () => {
        const firearm = factories.firearmControlTreeFactory({
            weapon: factories.firearmFactory({ammo: {num_dice: 2,
                dice: 6,
                leth: 6,
                extra_damage: 3,
                plus_leth: -1}})
        });
        expect(ReactDOM.findDOMNode(firearm).querySelector('.damage')
            .textContent).toEqual("2d6+3/6 (-1)");
    });

    const getBurstController = function (givenProps) {
        let props = {
            fit: 45,
            hasAutofireSkill: true,
            autofireRPM: 600
        };
        if (givenProps) {
            props = Object.assign(props, givenProps);
        }
        const skills = [
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
        return factories.firearmControlTreeFactory({
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

    it ("can calculate burst fire checks", () => {
        const firearm = getBurstController();
        const checks = firearm.burstChecks([2]);
        expect(checks.length).toEqual(1);
        expect(checks[0].length).toEqual(5);
        expect(checks[0]).toEqual([39, 37, 33, 27, 19]);
    });

    it ("can calculate burst fire checks for high FIT", () => {
        const firearm =  getBurstController({fit: 66});
        const checks = firearm.burstChecks([2]);
        expect(checks.length).toEqual(1);
        expect(checks[0].length).toEqual(5);
        expect(checks[0]).toEqual([45, 44, 40, 34, 26]);
    });

    it ("does not negate bonus from low action count in bursts", () => {
        const firearm =  getBurstController({fit: 66});
        const checks = firearm.burstChecks([1]);
        expect(checks.length).toEqual(1);
        expect(checks[0].length).toEqual(5);
        expect(checks[0]).toEqual([48, 48, 48, 43, 35]);
    });

    it ("takes missing Autofire skill into account", () => {
        const firearm =  getBurstController({fit: 66, hasAutofireSkill: false});
        const checks = firearm.burstChecks([1]);
        expect(checks.length).toEqual(1);
        expect(checks[0].length).toEqual(5);
        expect(checks[0]).toEqual([38, 38, 38, 33, 25]);
    });

    it ("takes low RPM into account", () => {
        const firearm = getBurstController({autofireRPM: 400});
        const checks = firearm.burstChecks([2]);
        expect(checks.length).toEqual(1);
        expect(checks[0].length).toEqual(5);
        expect(checks[0]).toEqual([39, 37, 33, null, null]);
    });

    it ("takes restricted bursts into account", () => {
        const firearm = getBurstController({restrictedBurstRounds: 3});
        const checks = firearm.burstChecks([2]);
        expect(checks.length).toEqual(1);
        expect(checks[0].length).toEqual(5);
        expect(checks[0]).toEqual([39, 37, 33, null, null]);
    });

    it ("can render sweep fire", () => {
        const firearm = getBurstController();
        const checks = firearm.sweepChecks(20);
        expect(checks.length).toEqual(16);
        expect(checks).toEqual([55, 53, 51, 49, 45, 41, 37, 33, 23, 13, 3,
            -7, -27, -47, -67, -87]);
    });

    it ("does not render sweep fire if it is disabled", () => {
        const firearm = getBurstController({sweepFireDisabled: true});
        const table = firearm.renderSweepTable();
        expect(table).toEqual('');
    });

    it ("takes missing Autofire skill into account in sweep fire", () => {
        const firearm = getBurstController({hasAutofireSkill: false});
        const checks = firearm.sweepChecks(20);
        expect(checks.length).toEqual(16);
        expect(checks).toEqual([45, 43, 41, 39, 35, 31, 27, 23, 13, 3, -7,
            -17, -37, -57, -77, -97]);
    });

    it ("counters sweep fire penalties with high FIT", () => {
        const firearm = getBurstController({fit: 72});
        const checks = firearm.sweepChecks(10);
        expect(checks.length).toEqual(8);
        expect(checks).toEqual([45, 45, 45, 44, 34, 24, 4, -16]);
    });

    it ("allows removal of the firearm", () => {
        const spy = jasmine.createSpy("callback");
        const firearm = factories.firearmControlTreeFactory({
            weapon: factories.firearmFactory({id: 5}),
            onRemove: spy
        });
        TestUtils.Simulate.click(ReactDOM.findDOMNode(firearm._removeButton));
        expect(spy).toHaveBeenCalledWith({id: 5});
    });
});