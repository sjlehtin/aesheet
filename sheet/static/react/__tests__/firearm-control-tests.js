jest.dontMock('../FirearmControl');
jest.dontMock('../SkillHandler');
jest.dontMock('../sheet-util');
jest.dontMock('./factories');
import React from 'react';
import ReactDOM from 'react-dom';
import TestUtils from 'react-addons-test-utils';

const FirearmControl = require('../FirearmControl').default;
const SkillTable = require('../SkillTable').default;
const SkillHandler = require('../SkillHandler').default;

var rest = require('sheet-rest');

var factories = require('./factories');

describe('FirearmControl', function() {
    "use strict";

    var getFirearmControl = function (givenProps) {
        var handlerProps = {
            characterSkills: [],
            allSkills: [
                factories.skillFactory({
                    name: "Pistol", stat: "dex",
                    required_skills: ["Basic Firearms"]
                }),
                factories.skillFactory({
                    name: "Basic Firearms",
                    stat: "dex"
                }),
                factories.skillFactory({
                    name: "Wheeled",
                    stat: "dex"
                }),
                factories.skillFactory({
                    name: "Handguns",
                    stat: "dex",
                    required_skills: ["Basic Firearms"]
                }),
                factories.skillFactory({
                    name: "Long guns",
                    stat: "dex",
                    required_skills: ["Basic Firearms"]
                })

            ],
            stats: {dex: 45}
        };
        if (givenProps && 'handlerProps' in givenProps) {
            handlerProps = Object.assign(handlerProps,
                givenProps.handlerProps);
            delete givenProps.handlerProps;
        }
        handlerProps.stats = factories.statsFactory(handlerProps.stats);

        var props = {
            weapon: factories.firearmFactory({base: {base_skill: "Pistol"}}),
            skillHandler: new SkillHandler(handlerProps)
        };
        if (givenProps) {
            props = Object.assign(props, givenProps);
        }
        var table = TestUtils.renderIntoDocument(
            <FirearmControl {...props}/>
        );

        return TestUtils.findRenderedComponentWithType(table,
            FirearmControl);
    };

    it("can calculate single fire skill checks", function () {
        var firearm = getFirearmControl();
        expect(firearm.skillCheck()).toEqual(11);
    });

    it("can calculate effect of missing specialization fire skill checks",
        function () {
        var firearm = getFirearmControl({
            handlerProps: {
                characterSkills: [factories.characterSkillFactory({
                    skill: "Handguns",
                    level: 1
                })]
            },
            weapon: factories.firearmFactory({base: {base_skill: "Handguns", skill: "Pistol"}})});
        expect(firearm.skillCheck()).toEqual(40);
    });

    it("notices specializations", function () {
        var firearm = getFirearmControl({
            handlerProps: {
                characterSkills: [factories.characterSkillFactory({
                    skill: "Pistol",
                    level: 1
                }),
                    factories.characterSkillFactory({
                        skill: "Handguns",
                        level: 1
                    })]
            },
            weapon: factories.firearmFactory({base: {base_skill: "Handguns", skill: "Pistol"}})});
        expect(firearm.skillCheck()).toEqual(50);
    });

    it ("calculates correct ROF", function() {
        var firearm = getFirearmControl({
            handlerProps: {
                characterSkills: [factories.characterSkillFactory({
                    skill: "Pistol",
                    level: 0
                })]},
            weapon: factories.firearmFactory({base: {base_skill: "Pistol"}})
        });
        expect(firearm.rof()).toBeCloseTo(2.86, 2);
    });

    it ("calculates correct ROF for higher skill level", function() {
        var firearm = getFirearmControl({
            handlerProps: {
                characterSkills: [factories.characterSkillFactory({
                    skill: "Pistol",
                    level: 3
                })]},
            weapon: factories.firearmFactory({base: {base_skill: "Pistol"}})
        });
        expect(firearm.rof()).toBeCloseTo(3.72, 2);
    });

    it ("can calculate a row of checks", function() {
        var firearm = getFirearmControl({
            handlerProps: {
                characterSkills: [factories.characterSkillFactory({
                    skill: "Pistol",
                    level: 0
                })]},
            weapon: factories.firearmFactory({base: {base_skill: "Pistol"}})
        });
        expect(firearm.skillChecks([0.5, 1, 2, 3, 4, 5, 6, 7, 8, 9]))
            .toEqual([55, 48, 45, 39, 32, 25, null, null, null, null]);
    });

    it ("takes into account penalties countered", function() {
        var firearm = getFirearmControl({
            handlerProps: {
                characterSkills: [factories.characterSkillFactory({
                    skill: "Pistol",
                    level: 0
                })],
                stats: {dex: 45, fit: 63}
            },
            weapon: factories.firearmFactory({base: {base_skill: "Pistol"}})
        });
        expect(firearm.skillChecks([0.5, 1, 2, 3, 4, 5, 6, 7, 8, 9]))
            .toEqual([55, 48, 45, 45, 38, 31, null, null, null, null]);
    });

    it ("can calculate a row of initiatives", function() {
        var firearm = getFirearmControl({
            handlerProps: {
                characterSkills: [factories.characterSkillFactory({
                    skill: "Pistol",
                    level: 0
                })]},
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
            hasAutofireSkill: true
        };
        if (givenProps) {
            props = Object.assign(props, givenProps);
        }
        var skills = [
            factories.characterSkillFactory({
                skill: "Long guns",
                level: 0})
        ];

        if (props.hasAutofireSkill) {
            skills.push(factories.characterSkillFactory({
                        skill: "Autofire",
                        level: 0}));
        }
        return getFirearmControl({
            handlerProps: {
                characterSkills: skills,
                stats: {dex: 45, fit: props.fit}
            },
            weapon: factories.firearmFactory({
            base: {name: "Invented",
                autofire_rpm: 600,
                autofire_class: "B",
                sweep_fire_disabled: false,
                restricted_burst_rounds: 0,
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
    })
});