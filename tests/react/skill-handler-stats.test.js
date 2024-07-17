import * as factories from './factories'
import SkillHandler from "../../react/SkillHandler";
import ValueBreakdown from "../../react/ValueBreakdown";
import {testSetup} from "./testutils";

describe('SkillHandler stats', function () {
    beforeAll(() => {
        testSetup()
    })
    afterEach(() => {
        factories.clearAll()
    })

    it('calculates eff stats', function () {
        var handler = factories.skillHandlerFactory({
            character: {cur_ref: 50, cur_int: 50}
        });

        expect(handler.getEffStats().dex.value()).toEqual(50);
    });

    it('calculates base stats', function () {
        var handler = factories.skillHandlerFactory({
            character: {cur_ref: 50, cur_int: 50}
        });

        expect(handler.getBaseStats().dex).toEqual(50);
    });

    it('calculates soft mods', function () {
        var handler = factories.skillHandlerFactory({
            character: {cur_ref: 50, cur_int: 50},
            effects: [
                factories.transientEffectFactory({dex: 10})]
        });

        expect(handler.getBaseStats().dex).toEqual(50);
        expect(handler.getEffStats().dex.value()).toEqual(60);
    });

    it('calculates hard mods', function () {
        var handler = factories.skillHandlerFactory({
            character: {cur_ref: 50, cur_int: 50},
            edges: [factories.edgeLevelFactory({dex: 10})]
        });

        expect(handler.getBaseStats().dex).toEqual(60);
        expect(handler.getEffStats().dex.value()).toEqual(60);
    });

    it('accounts for base mods', function () {
        var handler = factories.skillHandlerFactory({
            character: {
                cur_fit: 50, base_mod_fit: -2
            }
        });

        expect(handler.getBaseStats().fit).toEqual(48);
    });

    it('calculates weight penalties', function () {
        const handler = factories.skillHandlerFactory({
            character: factories.characterFactory({
                cur_fit: 50, cur_int: 50, cur_ref: 50, cur_wil: 50
            }),
            weightCarried: new ValueBreakdown(26, "initial")
        });

        expect(handler.getBaseStats().fit).toEqual(50);
        expect(handler.getEffStats().fit.value()).toEqual(44);
        expect(handler.getEffStats().int.value()).toEqual(50);
        expect(handler.getEffStats().dex.value()).toEqual(47);
        expect(handler.getEffStats().ref.value()).toEqual(44);
        expect(handler.getEffStats().mov.value()).toEqual(44);
    });

    it('takes low-G into account ', function () {
        const handler = factories.skillHandlerFactory({
            character: factories.characterFactory({
                cur_fit: 50, cur_int: 50, cur_ref: 50, cur_wil: 50, weigth: 80
            }),
            weightCarried: new ValueBreakdown(52, "initial"),
            gravity: 0.5
        });

        expect(handler.getBaseStats().fit).toEqual(50);
        expect(handler.getEffStats().fit.value()).toEqual(44);
        expect(handler.getEffStats().ref.value()).toEqual(31);
    })

    it('takes low-G maneuver into account ', function () {
        const handler = factories.skillHandlerFactory({
            character: factories.characterFactory({
                cur_fit: 50, cur_int: 50, cur_ref: 50, cur_wil: 50, weigth: 80
            }),
            skills: [{skill: "Low-G maneuver", level: 2}],
            weightCarried: new ValueBreakdown(52, "initial"),
            gravity: 0.5
        });

        expect(handler.getBaseStats().fit).toEqual(50);
        expect(handler.getEffStats().fit.value()).toEqual(44);
        expect(handler.getEffStats().ref.value()).toEqual(41);
    })

    it('takes high-G into account without carried gear', function () {
        const handler = factories.skillHandlerFactory({
            character: factories.characterFactory({
                cur_fit: 50, cur_int: 50, cur_ref: 50, cur_wil: 50, weigth: 80
            }),
            weightCarried: new ValueBreakdown(),
            gravity: 2.2
        });

        expect(handler.getBaseStats().fit).toEqual(50);
        expect(handler.getEffStats().fit.value()).toEqual(50);
        expect(handler.getEffStats().ref.value()).toEqual(50);

        expect(handler.getACPenalty().value).toEqual(-7)
    })

    it('takes high-G into account', function () {
        const handler = factories.skillHandlerFactory({
            character: factories.characterFactory({
                cur_fit: 50, cur_int: 50, cur_ref: 50, cur_wil: 50, weigth: 80
            }),
            weightCarried: new ValueBreakdown(12, "initial"),
            gravity: 2.2
        });

        expect(handler.getBaseStats().fit).toEqual(50);
        expect(handler.getEffStats().fit.value()).toEqual(44);
        expect(handler.getEffStats().ref.value()).toEqual(44);

        expect(handler.getACPenalty().value).toEqual(-7)
    })

    it('takes high-G maneuver into account ', function () {
        const handler = factories.skillHandlerFactory({
            character: factories.characterFactory({
                cur_fit: 50, cur_int: 50, cur_ref: 50, cur_wil: 50, weigth: 80
            }),
            skills: [{skill: "High-G maneuver", level: 1}],
            weightCarried: new ValueBreakdown(12, "initial"),
            gravity: 2.2
        });

        expect(handler.getEffStats().fit.value()).toEqual(44);
        expect(handler.getEffStats().ref.value()).toEqual(44);

        expect(handler.getACPenalty().value).toEqual(-2)
    })

    it('handles zero eff fit on weight penalty calculation', function () {
        const handler = factories.skillHandlerFactory({
            character: {cur_fit: 50},
            weightCarried: new ValueBreakdown(26, "initial"),
            wounds: [{location: "H", damage: 5}]
        });
        expect(handler.getWoundPenalties().aa).toEqual(-50);
        expect(handler.getEffStats().fit.value()).toEqual(-100);
    });

    it('handles negative eff fit on weight penalty calculation', function () {
        const handler = factories.skillHandlerFactory({
            character: {cur_fit: 50},
            weightCarried: new ValueBreakdown(26, "initial"),
            wounds: [{location: "H", damage: 5}, {location: "T", damage: 2}]
        });
        expect(handler.getWoundPenalties().aa).toEqual(-60);
        expect(handler.getEffStats().fit.value()).toEqual(-100);
    });

    it('takes transient effects into account in encumbrance', function () {
        // Transient effect should affect; +10 fit should decrease
        // penalties.
        var handler = factories.skillHandlerFactory({
            character: factories.characterFactory({
                cur_fit: 40, cur_int: 50, cur_ref: 50, cur_wil: 50
            }),
            effects: [
                factories.transientEffectFactory({fit: 10})],
            weightCarried: new ValueBreakdown(26, "initial"),
        });
        expect(handler.getBaseStats().fit).toEqual(40);
        expect(handler.getEffStats().fit.value()).toEqual(44);
        expect(handler.getEffStats().mov.value()).toEqual(44);
    });

    it('can calculate modifiers from edges', function () {
        var handler = factories.skillHandlerFactory({
            character: {
                cur_fit: 40, cur_int: 50, cur_ref: 50, cur_wil: 50
            },
            edges: [
                {edge: {name: "Natural climber"}, climb_multiplier: 2},
                {edge: {name: "Woodsman"}, climb_multiplier: 1.5}
            ],
        });
        expect(handler.getEdgeModifier('climb_multiplier')).toEqual(3.5);
    });

    it('returns a value with unrelated edges', function () {
        var handler = factories.skillHandlerFactory({
            character: {
                cur_fit: 40, cur_int: 50, cur_ref: 50, cur_wil: 50
            },
            edges: [
                {edge: {name: "Natural climber"}, climb_multiplier: "2.0"},
                {edge: {name: "Woodsman"}, climb_multiplier: "1.5"}
            ],
        });
        expect(handler.getEdgeModifier('swim_multiplier')).toEqual(0);

    });

    it('returns a value without edges', function () {
        var handler = factories.skillHandlerFactory({
            character: {
                cur_fit: 40, cur_int: 50, cur_ref: 50, cur_wil: 50
            }
        });
        expect(handler.getEdgeModifier('swim_multiplier')).toEqual(0);
    });

    it('is defensive about server data for edge modifiers', function () {
        const handler = factories.skillHandlerFactory();
        expect(handler.getEdgeModifier('foo_multiplier') <= 0).toEqual(true);
    });

    it('can calculate modifiers from effects', function () {
        var handler = factories.skillHandlerFactory({
            character: {
                cur_fit: 40, cur_int: 50, cur_ref: 50, cur_wil: 50
            },
            effects: [{swim_multiplier: "2.0"}],
        });
        expect(handler.getEffectModifier('swim_multiplier')).toEqual(2);
    });

    it('takes armor into account with penalties', function () {
        const handler = factories.skillHandlerFactory({
            character: {
                cur_fit: 40, cur_int: 50, cur_ref: 45, cur_psy: 50
            },
            armor: factories.armorFactory({
                base: {
                    mod_fit: -2,
                    mod_ref: -3,
                    mod_psy: -5
                }
            }),
        });
        expect(handler.getArmorStatMod('fit').value()).toEqual(-2);
        expect(handler.getEffStats().fit.value()).toEqual(38);
        expect(handler.getEffStats().ref.value()).toEqual(42);
        expect(handler.getEffStats().psy.value()).toEqual(45);
    });

    it('takes armor quality into account with penalties', function () {
        const handler = factories.skillHandlerFactory({
            character: factories.characterFactory({
                cur_fit: 40, cur_int: 50, cur_ref: 45, cur_psy: 50
            }),
            armor: factories.armorFactory({
                base: {
                    mod_fit: -2,
                    mod_ref: -3,
                    mod_psy: -5
                },
                quality: {
                    mod_fit: 1,
                    mod_ref: 2,
                    mod_psy: 3
                }
            }),
        });
        expect(handler.getEffStats().fit.value()).toEqual(39);
        expect(handler.getEffStats().ref.value()).toEqual(44);
        expect(handler.getEffStats().psy.value()).toEqual(48);
    });

    it('takes helm quality into account with penalties', function () {
        var handler = factories.skillHandlerFactory({
            character: factories.characterFactory({
                cur_fit: 40, cur_int: 50, cur_ref: 45, cur_psy: 50
            }),
            helm: factories.armorFactory({
                base: {
                    mod_fit: -2,
                    mod_ref: -3,
                    mod_psy: -5
                },
                quality: {
                    mod_fit: 1,
                    mod_ref: 2,
                    mod_psy: 3
                }
            }),
        });
        expect(handler.getEffStats().fit.value()).toEqual(39);
        expect(handler.getEffStats().ref.value()).toEqual(44);
        expect(handler.getEffStats().psy.value()).toEqual(48);
    });

    it('caps quality penalty counter', function () {
        var handler = factories.skillHandlerFactory({
            character: factories.characterFactory({
                cur_psy: 50
            }),
            helm: factories.armorFactory({
                base: {
                    mod_psy: -5
                },
                quality: {
                    mod_psy: 10
                }
            }),
        });
        expect(handler.getEffStats().psy.value()).toEqual(50);
    });

    it('calculates MOV', function () {
        var handler = factories.skillHandlerFactory({
            character: {
                cur_fit: 49,
                cur_ref: 51
            }
        });

        expect(handler.getBaseStats().mov).toEqual(50);
        expect(handler.getEffStats().mov.value()).toEqual(50);
    });

    it('calculates DEX', function () {
        var handler = factories.skillHandlerFactory({
            character: {
                cur_int: 49,
                cur_ref: 51
            }
        });

        expect(handler.getBaseStats().dex).toEqual(50);
        expect(handler.getEffStats().dex.value()).toEqual(50);
    });

    it('calculates IMM', function () {
        var handler = factories.skillHandlerFactory({
            character: {
                cur_fit: 49,
                cur_psy: 51
            }
        });

        expect(handler.getBaseStats().imm).toEqual(50);
        expect(handler.getEffStats().imm.value()).toEqual(50);
    });

    it('calculates MOV with effect', function () {
        var handler = factories.skillHandlerFactory({
            character: {cur_fit: 49, cur_ref: 51},
            effects: [{mov: 5}]
        });

        expect(handler.getBaseStats().mov).toEqual(50);
        expect(handler.getEffStats().mov.value()).toEqual(55);
    });

    it('calculates DEX with effect', function () {
        var handler = factories.skillHandlerFactory({
            character: {cur_int: 49, cur_ref: 51},
            effects: [{dex: 5}]
        });

        expect(handler.getBaseStats().dex).toEqual(50);
        expect(handler.getEffStats().dex.value()).toEqual(55);
    });

    it('calculates IMM with effect', function () {
        var handler = factories.skillHandlerFactory({
            character: {cur_fit: 49, cur_psy: 51},
            effects: [{imm: 5}]
        });

        expect(handler.getBaseStats().imm).toEqual(50);
        expect(handler.getEffStats().imm.value()).toEqual(55);
    });

    it('calculates stamina', function () {
        var handler = factories.skillHandlerFactory({
            character: {
                cur_ref: 45, cur_wil: 45
            }
        });
        expect(handler.getBaseStats().stamina).toEqual(23);
    });

    it('calculates stamina taking bought_stamina into account',
        function () {
            var handler = factories.skillHandlerFactory({
                character: {
                    cur_ref: 45, cur_wil: 45, bought_stamina: 5
                }
            });
            expect(handler.getBaseStats().stamina).toEqual(28);
        });

    it('calculates body', function () {
        var handler = factories.skillHandlerFactory({
            character: {
                cur_fit: 61
            }
        });
        expect(handler.getBaseStats().baseBody).toEqual(16);
        expect(handler.getBaseStats().body).toEqual(16);
    });

    it('calculates body taking toughness into account', function () {
        var handler = factories.skillHandlerFactory({
            character: {
                cur_fit: 61
            },
            edges: [
                {edge: "Toughness", level: 2},
            ]
        });
        expect(handler.getBaseStats().baseBody).toEqual(16);
        expect(handler.getBaseStats().body).toEqual(20);
    });

    it('calculates initiative', function () {
        var handler = factories.skillHandlerFactory({
            character: {
                cur_ref: 45, cur_int: 45, cur_psy: 46
            }
        });
        expect(Math.round(handler.getInitiative())).toEqual(9);
    });

    it('gives no AC penalty when not damaged', function () {
        var handler = factories.skillHandlerFactory({
            character: {
                cur_ref: 45, cur_wil: 45, bought_stamina: 5
            }
        });
        expect(handler.getACPenalty().value).toEqual(0);
    });

    it('calculates AC penalty when damaged', function () {
        var handler = factories.skillHandlerFactory({
            character: {
                cur_ref: 45, cur_wil: 45,
                bought_stamina: 5,
            },
            staminaDamage: 15
        });
        expect(handler.getACPenalty().value).toEqual(-10);
    });

    it('calculates initiative penalty when damaged a lot', function () {
        var handler = factories.skillHandlerFactory({
            character: {
                cur_ref: 45, cur_int: 45, cur_psy: 46, cur_wil: 45,
                bought_stamina: 5,
            },
            staminaDamage: 15
        });
        expect(Math.round(handler.getInitiative())).toEqual(8);
    });

    it('allows fetching the init penalty when AC penalty is known', function () {
        expect(SkillHandler.getInitPenaltyFromACPenalty(10)).toEqual(0);
        expect(SkillHandler.getInitPenaltyFromACPenalty(-11)).toEqual(-1);
        expect(SkillHandler.getInitPenaltyFromACPenalty(-19)).toEqual(-1);
        expect(SkillHandler.getInitPenaltyFromACPenalty(-20)).toEqual(-2);
    });

    it('applies AC penalty to skill check', function () {
        const handler = factories.skillHandlerFactory({
            character: {
                cur_ref: 45, cur_int: 45,
                cur_psy: 46, cur_wil: 45,
                bought_stamina: 5,
            },
            staminaDamage: 15,
            skills: [{skill: {name: "Pistol", stat: 'DEX'}, level: 1,}]
        });
        expect(handler.skillLevel("Pistol")).toEqual(1)
        expect(handler.skillCheck("Pistol").value()).toEqual(40);
    });


    it('ignore power armor skill with non-powered armor', function () {
        const handler = factories.skillHandlerFactory({
            character: {
                cur_fit: 40, cur_int: 50, cur_ref: 45, cur_psy: 50
            },
            skills: [{
                skill: {
                    name: "Power armor", "powered_ref_counter": 3,
                    "powered_fit_mod": 2,
                }, level: 3,
            }],
            armor: factories.armorFactory({
                base: {
                    mod_fit: -10,
                    mod_ref: -15,
                    mod_psy: -5
                }
            }),
        });
        expect(handler.getEffStats().fit.value()).toEqual(30);
        expect(handler.getEffStats().ref.value()).toEqual(30);
        expect(handler.getEffStats().psy.value()).toEqual(45);
    });

    it('take power armor skill into account with powered armor', function () {
        const handler = factories.skillHandlerFactory({
            character: {
                cur_fit: 40, cur_int: 50, cur_ref: 45, cur_psy: 50
            },
            skills: [{
                skill: "Power armor",
                level: 3,
            }],
            allSkills: [{
                name: "Power armor",
                powered_ref_counter: 3,
                powered_fit_mod: 2,
            }],
            armor: factories.armorFactory({
                base: {
                    is_powered: true,
                    mod_fit: 10,
                    mod_ref: -15,
                    mod_psy: -5
                }
            }),
            weightCarried: 0
        });
        expect(handler.getSkillBenefit("powered_fit_mod").value()).toEqual(6)
        expect(handler.getSkillBenefit("powered_ref_counter").value()).toEqual(9)

        expect(handler.getArmorStatMod("ref").value()).toEqual(-6)
        expect(handler.getArmorStatMod("fit").value()).toEqual(16)

        expect(handler.getEffStats().fit.value()).toEqual(56);
        expect(handler.getEffStats().ref.value()).toEqual(39);
        expect(handler.getEffStats().psy.value()).toEqual(45);

        expect(handler.getCarriedWeight().value()).toEqual(0)
    });

    it('factors in power armor suspension from fit bonus', function () {
        const handler = factories.skillHandlerFactory({
            character: {
                cur_fit: 40, cur_int: 50, cur_ref: 45, cur_psy: 50
            },
            skills: [{
                skill: "Power armor",
                level: 3,
            }],
            allSkills: [{
                name: "Power armor",
                powered_ref_counter: 3,
                powered_fit_mod: 2,
            }],
            armor: factories.armorFactory({
                base: {
                    is_powered: true,
                    mod_fit: 10,
                    mod_ref: -15,
                    mod_psy: -5
                }
            }),
            weightCarried: new ValueBreakdown(40, "initial")
        });
        // 10 + 6 -> should suspend 16 kg of weight
        expect(handler.getCarriedWeight().value()).toEqual(24)
    })
})
;