import React from 'react';
import {render, within} from '@testing-library/react'
import {rest} from 'msw'
import {setupServer} from 'msw/node'
import userEvent from '@testing-library/user-event'

const FirearmControl = require('FirearmControl').default;

const factories = require('./factories');


const server = setupServer(
  rest.get('http://localhost/rest/ammunition/firearm/*/', (req, res, ctx) => {
    return res(ctx.json([]))
  }),
  rest.get('http://localhost/rest/scopes/campaign/*/', (req, res, ctx) => {
    return res(ctx.json([]))
  }),
)

describe('FirearmControl', () => {
    beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
    afterEach(() => server.resetHandlers());
    afterAll(() => server.close());

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
            weapon: {base: {duration: "0.110", sight: 600, barrel_length: 602, accuracy: 1.0},
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

    const renderFirearm = (givenProps) => {

        let props = {
            base: {base_skill: "Handguns", skill: "Pistol"},
            handlerProps: {
                character: {cur_int: 50, cur_ref: 50, cur_fit: 45, cur_psy: 50},
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
            if (givenProps.handlerProps) {
                props.handlerProps = Object.assign(props.handlerProps,
                    givenProps.handlerProps);
                delete givenProps.handlerProps;
            }
            if (givenProps.weapon) {
                props.weapon = Object.assign(props.weapon, givenProps.weapon);
                delete givenProps.weapon;
            }
            props = Object.assign(props, givenProps);
        }
        return render(<FirearmControl {...factories.firearmControlPropsFactory(props)} />)
    }

    function getActionChecks(firearm) {
        let values = []
        firearm.getByRole("row", {name: /Action/})
            .querySelectorAll('td').forEach((el) => values.push(el.textContent))
        return values.slice(3, 13);
    }

    function getInitiatives(firearm) {
        let values = []
        firearm.getByRole("row", {name: /Initiatives/})
            .querySelectorAll('td').forEach((el) => values.push(el.textContent))
        return values.slice(1, 12);
    }

    it("can calculate single fire skill checks", async () => {
        const firearm = renderFirearm()

        expect(firearm.getByLabelText("Rate of fire").textContent).toEqual("3.15")
        const values = getActionChecks(firearm);
        expect(values.slice(0, 8)).toEqual(["65", "58", "55", "55", "45", "38", "32", ""])
    });

    it("can calculate contact range effects", () => {
        const firearm = renderFirearm({toRange: "0.4"});
        // Should get +60 from range
        const rangeEffect = firearm.getByRole("row", {name: "Range effect"})
        expect(within(rangeEffect).getByLabelText("Check modifier").textContent).toEqual("+60")
        const values = getActionChecks(firearm);
        expect(values[0]).toEqual("125")

        expect(within(rangeEffect).getByLabelText("Target initiative modifier").textContent).toEqual("+2")
        expect(within(rangeEffect).getByLabelText("Damage modifier").textContent).toEqual("+2")
        expect(within(rangeEffect).getByLabelText("Lethality modifier").textContent).toEqual("+2")
        expect(within(rangeEffect).getByLabelText("Name").textContent).toEqual("Contact")
    });

    it("can calculate close range effects", () => {
        const firearm = renderFirearm({toRange: "1"});
        const rangeEffect = firearm.getByRole("row", {name: "Range effect"})
        expect(within(rangeEffect).getByLabelText("Check modifier").textContent).toEqual("+50")

        expect(within(rangeEffect).getByLabelText("Target initiative modifier").textContent).toEqual("+2")
        expect(within(rangeEffect).getByLabelText("Damage modifier").textContent).toEqual("+2")
        expect(within(rangeEffect).getByLabelText("Lethality modifier").textContent).toEqual("+2")
        expect(within(rangeEffect).getByLabelText("Name").textContent).toEqual("Close")
    });

    it("can calculate point-blank range effects", () => {
        const firearm = renderFirearm({toRange: "3"});
        const rangeEffect = firearm.getByRole("row", {name: "Range effect"})
        expect(within(rangeEffect).getByLabelText("Check modifier").textContent).toEqual("+40")

        expect(within(rangeEffect).getByLabelText("Target initiative modifier").textContent).toEqual("+1")
        expect(within(rangeEffect).getByLabelText("Damage modifier").textContent).toEqual("+1")
        expect(within(rangeEffect).getByLabelText("Lethality modifier").textContent).toEqual("+1")
        expect(within(rangeEffect).getByLabelText("Name").textContent).toEqual("Point-blank")
    });

    it("can calculate XXS range effects", () => {
        const firearm = renderFirearm({toRange: "7"});
        const rangeEffect = firearm.getByRole("row", {name: "Range effect"})
        expect(within(rangeEffect).getByLabelText("Check modifier").textContent).toEqual("+30")

        expect(within(rangeEffect).getByLabelText("Target initiative modifier").textContent).toEqual("+1")
        expect(within(rangeEffect).getByLabelText("Damage modifier").textContent).toEqual("+1")
        expect(within(rangeEffect).getByLabelText("Lethality modifier").textContent).toEqual("+1")
        expect(within(rangeEffect).getByLabelText("Name").textContent).toEqual("XXS")
    });

    it("can calculate extra-short range effects", () => {
        const firearm = renderFirearm({toRange: "15"});
        const rangeEffect = firearm.getByRole("row", {name: "Range effect"})
        expect(within(rangeEffect).getByLabelText("Check modifier").textContent).toEqual("+20")

        expect(within(rangeEffect).getByLabelText("Target initiative modifier").textContent).toEqual("+0")
        expect(within(rangeEffect).getByLabelText("Damage modifier").textContent).toEqual("+0")
        expect(within(rangeEffect).getByLabelText("Lethality modifier").textContent).toEqual("+0")
        expect(within(rangeEffect).getByLabelText("Name").textContent).toEqual("Extra-short")
    });

    it("can calculate very short range effects", () => {
        const firearm = renderFirearm({toRange: "30"});
        const rangeEffect = firearm.getByRole("row", {name: "Range effect"})
        expect(within(rangeEffect).getByLabelText("Check modifier").textContent).toEqual("+10")

        expect(within(rangeEffect).getByLabelText("Target initiative modifier").textContent).toEqual("+0")
        expect(within(rangeEffect).getByLabelText("Damage modifier").textContent).toEqual("+0")
        expect(within(rangeEffect).getByLabelText("Lethality modifier").textContent).toEqual("+0")
        expect(within(rangeEffect).getByLabelText("Name").textContent).toEqual("Very short")
    });

    it("can calculate short range effects", () => {
        const firearm = renderFirearm({toRange: "60"});
        const rangeEffect = firearm.getByRole("row", {name: "Range effect"})
        expect(within(rangeEffect).getByLabelText("Check modifier").textContent).toEqual("+0")

        expect(within(rangeEffect).getByLabelText("Target initiative modifier").textContent).toEqual("+0")
        expect(within(rangeEffect).getByLabelText("Damage modifier").textContent).toEqual("+0")
        expect(within(rangeEffect).getByLabelText("Lethality modifier").textContent).toEqual("+0")
        expect(within(rangeEffect).getByLabelText("Name").textContent).toEqual("Short")
    });

    it("can calculate medium range effects", () => {
        const firearm = renderFirearm({toRange: "61"});
        const rangeEffect = firearm.getByRole("row", {name: "Range effect"})
        expect(within(rangeEffect).getByLabelText("Check modifier").textContent).toEqual("-10")

        expect(within(rangeEffect).getByLabelText("Target initiative modifier").textContent).toEqual("+0")
        expect(within(rangeEffect).getByLabelText("Damage modifier").textContent).toEqual("+0")
        expect(within(rangeEffect).getByLabelText("Lethality modifier").textContent).toEqual("+0")
        expect(within(rangeEffect).getByLabelText("Name").textContent).toEqual("Medium")
    });

    it("can calculate long range effects", () => {
        const firearm = renderFirearm({toRange: "180"});
        const rangeEffect = firearm.getByRole("row", {name: "Range effect"})
        // Includes -5 for INT check
        expect(within(rangeEffect).getByLabelText("Check modifier").textContent).toEqual("-25")

        expect(within(rangeEffect).getByLabelText("Target initiative modifier").textContent).toEqual("+0")
        expect(within(rangeEffect).getByLabelText("Damage modifier").textContent).toEqual("+0")
        expect(within(rangeEffect).getByLabelText("Lethality modifier").textContent).toEqual("+0")
        expect(within(rangeEffect).getByLabelText("Name").textContent).toEqual("Long")
    });

    it("can calculate extra long range effects", () => {
        const firearm = renderFirearm({toRange: "270"});
        const rangeEffect = firearm.getByRole("row", {name: "Range effect"})
        // Includes -15 for INT check
        expect(within(rangeEffect).getByLabelText("Check modifier").textContent).toEqual("-45")

        expect(within(rangeEffect).getByLabelText("Target initiative modifier").textContent).toEqual("-1")
        expect(within(rangeEffect).getByLabelText("Damage modifier").textContent).toEqual("-1")
        expect(within(rangeEffect).getByLabelText("Lethality modifier").textContent).toEqual("-1")
        expect(within(rangeEffect).getByLabelText("Name").textContent).toEqual("Extra-long")
    });

    it("can calculate XXL range effects", () => {
        const firearm = renderFirearm({toRange: "360"});
        const rangeEffect = firearm.getByRole("row", {name: "Range effect"})
        // Includes -15 for INT check
        expect(within(rangeEffect).getByLabelText("Check modifier").textContent).toEqual("-55")

        expect(within(rangeEffect).getByLabelText("Target initiative modifier").textContent).toEqual("-2")
        expect(within(rangeEffect).getByLabelText("Damage modifier").textContent).toEqual("-2")
        expect(within(rangeEffect).getByLabelText("Lethality modifier").textContent).toEqual("-2")
        expect(within(rangeEffect).getByLabelText("Name").textContent).toEqual("XXL")
    });

    it("can calculate instinctive fire", () => {
        const firearm = renderFirearm({
            handlerProps: {
                skills: [{
                    skill: "Handguns",
                    level: 1
                }, {skill: "Instinctive fire", level: 2}],
            },
            toRange: "25"
        });
        const rangeEffect = firearm.getByRole("row", {name: "Range effect"})

        expect(within(rangeEffect).getByLabelText("Target initiative modifier").textContent).toEqual("+2")
    });

    it("recognizes INT for instinctive fire range", () => {
        const firearm = renderFirearm({
            handlerProps: {
                skills: [{
                    skill: "Handguns",
                    level: 1
                }, {skill: "Instinctive fire", level: 2}],
            },
            toRange: "26"
        });
        const rangeEffect = firearm.getByRole("row", {name: "Range effect"})

        expect(within(rangeEffect).getByLabelText("Target initiative modifier").textContent).toEqual("+0")
    });

    it("recognizes that target-I can not be positive", () => {
        const firearm = renderFirearm({
            handlerProps: {
                skills: [{
                    skill: "Handguns",
                    level: 1
                }, {skill: "Instinctive fire", level: 2}],
                weapon: {base: {sight: 600, barrel_length: 602, accuracy: 1.0,
                    target_initiative: -1},
                         scope: null}
            },
            toRange: "25"
        });
        const rangeEffect = firearm.getByRole("row", {name: "Range effect"})

        expect(within(rangeEffect).getByLabelText("Target initiative modifier").textContent).toEqual("+2")
        expect(firearm.getByLabelText("Target initiative").textContent).toEqual("+0")
    });

    it("does not use instinctive fire for default range", () => {
        const firearm = renderFirearm({
            handlerProps: {
                skills: [{
                    skill: "Handguns",
                    level: 1
                }, {skill: "Instinctive fire", level: 2}],
                weapon: {base: {sight: 600, barrel_length: 602, accuracy: 1.0,
                    target_initiative: -1},
                         scope: null}
            },
        });
        const rangeEffect = firearm.getByRole("row", {name: "Range effect"})

        expect(within(rangeEffect).getByLabelText("Target initiative modifier").textContent).toEqual("+0")
        expect(firearm.getByLabelText("Target initiative").textContent).toEqual("-1")
    });

    it("renders damage with XXL range effects", () => {
        const firearm = renderFirearm({toRange: "360"});
        expect(firearm.getByLabelText("Damage").textContent).toContain("2d6+0/3 (+1)")
    });

    it("renders damage with XXL range effects", () => {
        const firearm = renderFirearm({toRange: "0.3"});
        expect(firearm.getByLabelText("Damage").textContent).toContain("2d6+4/7 (+1)")
    });

    it("renders even with impossible range", () => {
        const firearm = renderFirearm({toRange: "20000"});
        const rangeEffect = firearm.queryByRole("row", {name: "Range effect"})
        expect(rangeEffect).toBeNull()
        expect(firearm.getByText("Unable to shoot to this range")).toBeTruthy()
        expect(firearm.getByLabelText("Damage").textContent).toContain("range too long!")
    });

    it("renders even with impossible range and burst capable weapon", () => {
        const firearm = renderFirearm({
            weapon:
                {base: {autofire_rpm: 600, autofire_class: "C"}},
            toRange: "20000"
        });
        const rangeEffect = firearm.queryByRole("row", {name: "Range effect"})
        expect(rangeEffect).toBeNull()
        expect(firearm.getByText("Unable to shoot to this range")).toBeTruthy()
        expect(firearm.getByLabelText("Damage").textContent).toContain("range too long!")
    });

    it("recognizes darkness penalty makes extreme ranges shorter", () => {
        const firearm = renderFirearm({
            darknessDetectionLevel: -3,
            toRange: "360"
        });

        const rangeEffect = firearm.queryByRole("row", {name: "Range effect"})
        expect(rangeEffect).toBeNull()

    })

    it("calculates darkness penalty into range effects", () => {
        const firearm = renderFirearm({darknessDetectionLevel: -3, toRange: "100"});

        const rangeEffect = firearm.queryByRole("row", {name: "Range effect"})
        expect(within(rangeEffect).getByLabelText("Check modifier").textContent).toEqual("-65")
        expect(within(rangeEffect).getByLabelText("Name").textContent).toEqual("Medium")
    });

    //
    // // it("can calculate bumping based on range", () => {
    // //     const firearm = rangeFirearm();
    // //     let rangeEffect = firearm.rangeEffect(25);
    // //     expect(rangeEffect.check).toEqual(-10);
    // //     expect(rangeEffect.targetInitiative).toEqual(0);
    // //     // TODO: should be false
    // //     //expect(rangeEffect.bumpingAllowed).toBe(true);
    // // });
    //
    // // it("takes Acute Vision into account", () => {
    // //     const firearm = rangeFirearm({handlerProps: {
    // //         edges: [{edge: "Acute Vision", level: 2}]}});
    // //     let rangeEffect = firearm.rangeEffect(360);
    // //     // Acute vision 2 equals +1DL -> +10,
    // //     // Acute vision 2 should lower range penalties by +10
    // //     expect(rangeEffect.check).toEqual(-35);
    // //     expect(rangeEffect.targetInitiative).toEqual(-2);
    // // });
    //
    // // it("takes scope's Acute Vision into account", () => {
    // //     const firearm = rangeFirearm();
    // //     let rangeEffect = firearm.rangeEffect(25);
    // //     expect(rangeEffect.check).toEqual(-10);
    // //     expect(rangeEffect.targetInitiative).toEqual(0);
    // //     // TODO: should be false
    // //     //expect(rangeEffect.bumpingAllowed).toBe(true);
    // //
    // //     // there should be only one call to the skillHandler.visionCheck TODO: TBC
    // // });

    xit('accounts for the Color blind flaw correctly in daylight', test.todo)
    xit('ignores for the Color blind flaw correctly in night time', test.todo)

    it ("can calculate a row of checks to implicit short range", () => {
        const firearm = renderFirearm({
            weapon: {ammo: {weight: "7.450", velocity: 440}}
        })
        expect(firearm.getByLabelText("Rate of fire").textContent).toEqual("3.16")
        const values = getActionChecks(firearm);
        expect(values).toEqual(["65", "58", "55", "55", "45", "38", "32", "",  "", ""])
    });

    it ("can calculate a row of checks to short range", () => {
        const firearm = renderFirearm({
            toRange: "60",
            weapon: {ammo: {weight: "7.450", velocity: 440}}
        })
        expect(firearm.getByLabelText("Rate of fire").textContent).toEqual("3.16")
        const values = getActionChecks(firearm);
        expect(values).toEqual(["65", "58", "55", "55", "45", "38", "32", "",  "", ""])
    });

    it ("can calculate a row of checks to medium range", () => {
        const firearm = renderFirearm({
            toRange: "61",
            weapon: {ammo: {weight: "7.450", velocity: 440}}
        })
        expect(firearm.getByLabelText("Rate of fire").textContent).toEqual("3.16")
        const values = getActionChecks(firearm);
        expect(values).toEqual(["55", "48", "45", "45", "35", "28", "22", "",  "", ""])
    });

    it ("can calculate a row of initiatives to short range", () => {
        const firearm = renderFirearm({toRange: 60});

        const values = getInitiatives(firearm);
        expect(values).toEqual(["+9", "+7", "+3", "-2", "+6", "+1", "-4", "",  "", ""])
    });

    it ("can calculate a row of initiatives to extra-long range", () => {
        const firearm = renderFirearm({toRange: 181});

        const values = getInitiatives(firearm);
        expect(values).toEqual(["+9", "+6", "+2", "-3", "+5", "+0", "-5", "",  "", ""])
    });

    it("can calculate effect of missing specialization skill checks", () => {
        const firearm = renderFirearm({
            handlerProps: {
                skills: [{
                    skill: "Handguns",
                    level: 1
                }]
            },
            weapon: factories.firearmFactory({base: {base_skill: "Handguns", skill: "Pistol"}})});
        expect(firearm.getByLabelText("Base check").textContent).toEqual("45")
    });

    it("can calculate skill check recognizing specializations", () => {
        const firearm = renderFirearm({
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
        expect(firearm.getByLabelText("Base check").textContent).toEqual("55")
    });

    it("calculates range for pistols", () => {
        const firearm = renderFirearm({
            weapon: {base: {sight: 153, barrel_length: 102, accuracy: 1.0}},
        });
        expect(firearm.getByLabelText("Short range").textContent).toEqual("12")
    });

    it("calculates range for pistols", () => {
        const firearm = renderFirearm({
            weapon: {
                base: {sight: 153, barrel_length: 102, accuracy: 0.6},
                scope: {sight: 600}
            }
        });
        expect(firearm.getByLabelText("Short range").textContent).toEqual("21")
    });

    it("calculates scope into target initiative", () => {
        const firearm = renderFirearm({
            weapon: {base: {sight: 153, barrel_length: 102, accuracy: 0.6, target_initiative: -2},
            scope: {sight: 600, target_i_mod: -2}}
        });
        expect(firearm.getByLabelText("Target initiative").textContent).toEqual("-4")
    });

    it("does not use sight equal to zero from scope, only initiative", () => {
        const firearm = renderFirearm({
            weapon: {
                base: {
                    sight: 153,
                    barrel_length: 102,
                    accuracy: 1.0,
                    target_initiative: -2
                },
                scope: {sight: 0, target_i_mod: 1}
            }
        });
        expect(firearm.getByLabelText("Short range").textContent).toEqual("12")
        expect(firearm.getByLabelText("Target initiative").textContent).toEqual("-1")
    });

    it("calculates range for assault rifles", () => {
        const firearm = renderFirearm({
            weapon: {base: {sight: 378, barrel_length: 415, accuracy: 1.0},
            scope: null}
        });
        expect(firearm.getByLabelText("Short range").textContent).toEqual("39")
    });

    it("calculates range for a good SMG", () => {
        const firearm = renderFirearm({
            weapon: {base: {sight: 340, barrel_length: 225, accuracy: 1.08},
                scope: null}
        });
        expect(firearm.getByLabelText("Short range").textContent).toEqual("30")
    });

    it("calculates long range for pistols", () => {
        const firearm = renderFirearm({
            weapon: {base: {stock: 1}, ammo: {velocity: 359}}
        });
        expect(firearm.getByLabelText("Short range").textContent).toEqual("12")
        expect(firearm.getByLabelText("Long range").textContent).toEqual("36")
    });

    it("calculates long range for assault rifles", () => {
        const firearm = renderFirearm({
            weapon: {base: {stock: 1.25}, ammo: {velocity: 715}}
        });
        expect(firearm.getByLabelText("Short range").textContent).toEqual("12")
        expect(firearm.getByLabelText("Long range").textContent).toEqual("60")
    });

    it("calculates long range for sniper rifles", () => {
        const firearm = renderFirearm({
            weapon: {base: {stock: 1.50}, ammo: {velocity: 900}}
        });
        expect(firearm.getByLabelText("Short range").textContent).toEqual("12")
        expect(firearm.getByLabelText("Long range").textContent).toEqual("72")
    });

    it ("calculates correct ROF", () => {
        const firearm = renderFirearm({
            handlerProps: {
                skills: [{
                    skill: "Pistol",
                    level: 0
                }]},
            weapon: factories.firearmFactory({base: {base_skill: "Pistol"}})
        })

        expect(firearm.getByLabelText("Rate of fire").textContent).toEqual("2.86")
    });

    it ("calculates correct ROF for higher skill level", () => {
        const firearm = renderFirearm({
            handlerProps: {
                skills: [{
                    skill: "Pistol",
                    level: 3
                }]},
            weapon: factories.firearmFactory({base: {base_skill: "Pistol"}})
        })

        expect(firearm.getByLabelText("Rate of fire").textContent).toEqual("3.72")
    });

    it ("can calculate a row of checks", () => {
        const firearm = renderFirearm({
            handlerProps: {
                skills: [{
                    skill: "Pistol",
                    level: 0
                }]},
            weapon: factories.firearmFactory({base: {base_skill: "Pistol"}})
        })

        const values = getActionChecks(firearm);
        expect(values).toEqual(["60", "53", "50", "44", "37", "30", "", "",  "", ""])
    });

    it ("takes into account penalties countered", () => {
        const firearm = renderFirearm({
            handlerProps: {
                skills: [{
                    skill: "Pistol",
                    level: 0
                }],
                character: {cur_int: 45, cur_ref: 45, cur_fit: 63}
            },
            weapon: factories.firearmFactory({base: {base_skill: "Pistol"}})
        })

        const values = getActionChecks(firearm);
        expect(values).toEqual(["55", "48", "45", "45", "38", "31", "", "",  "", ""])
    });

    it ("can calculate a row of initiatives", () => {
        const firearm = renderFirearm({
            handlerProps: {
                character: {cur_int: 45, cur_ref: 45, cur_fit: 45,
                    cur_psy: 45},
                skills: [{
                    skill: "Pistol",
                    level: 0
                }]},
            weapon: factories.firearmFactory({base: {base_skill: "Pistol"}})
        })

        const values = getInitiatives(firearm);
        expect(values).toEqual(["+8", "+6", "+1", "-4", "+5", "-1", "", "",  "", ""])
    });


    it ("can render damage", () => {
        const firearm = renderFirearm({
            weapon: factories.firearmFactory({ammo: {num_dice: 2,
                dice: 6,
                leth: 6,
                extra_damage: 3,
                plus_leth: -1}})
        });
        // Should get +60 from range
        expect(firearm.getByLabelText("Damage").textContent).toEqual("2d6+3/6 (-1)")
    });

    const renderFirearmControlWithBurst= function (givenProps) {
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
        return render(<FirearmControl {...factories.firearmControlPropsFactory({
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
        })})}/>);
    };

    async function getBurstChecks(firearm, burst) {
        const elems = await firearm.findAllByLabelText(new RegExp(`Burst ${burst} To-Hit`))
        const values = elems.map((el) => {
            return el.textContent
        })
        return values;
    }

    it ("can calculate burst fire checks", async () => {
        const firearm = renderFirearmControlWithBurst();
        const values = await getBurstChecks(firearm, 3);
        expect(values).toEqual(["39", "37", "33", "27", "19"]);
    });

    it ("can calculate burst fire checks for high FIT", async () => {
        const firearm = renderFirearmControlWithBurst({fit: 66});
        const values = await getBurstChecks(firearm, 3);
        expect(values).toEqual(["45", "44", "40", "34", "26"]);
    });

    it ("does not negate bonus from low action count in bursts", async () => {
        const firearm = renderFirearmControlWithBurst({fit: 66});
        const values = await getBurstChecks(firearm, 2);
        expect(values).toEqual(["48", "48", "48", "43", "35"]);
    });

    it ("takes missing Autofire skill into account", async () => {
        const firearm = renderFirearmControlWithBurst({fit: 66, hasAutofireSkill: false});
        const values = await getBurstChecks(firearm, 2);
        expect(values).toEqual(["38", "38", "38", "33", "25"]);
    });

    it ("takes low RPM into account", async () => {
        const firearm = renderFirearmControlWithBurst({autofireRPM: 400});
        const values = await getBurstChecks(firearm, 3);
        expect(values).toEqual(["39", "37", "33", "", ""]);
    });

    it ("takes restricted bursts into account", async () => {
        const firearm = renderFirearmControlWithBurst({restrictedBurstRounds: 3});
        const values = await getBurstChecks(firearm, 3);
        expect(values).toEqual(["39", "37", "33", "", ""]);
    });

    async function getSweepChecks(firearm, sweep) {
        const elems = await firearm.findAllByLabelText(new RegExp(`Sweep ${sweep} to-hit`))
        const values = elems.map((el) => {
            return el.textContent
        })
        return values;
    }

    it ("can render sweep fire", async () => {
        const firearm = renderFirearmControlWithBurst({restrictedBurstRounds: 3});
        const values = await getSweepChecks(firearm, "20");
        expect(values).toEqual(["-87", "-67", "-47", "-27", "-7", "3", "13", "23", "33", "37", "41", "45", "49", "51", "53", "55"]);
    });

    it ("does not render sweep fire if it is disabled", async () => {
        const firearm = renderFirearmControlWithBurst({sweepFireDisabled: true});
        const el = firearm.queryAllByRole("table", {name: "Sweep fire to-hit"})
        expect(el).toEqual([])
    });

    it ("takes missing Autofire skill into account in sweep fire", async () => {
        const firearm = renderFirearmControlWithBurst({hasAutofireSkill: false});
        const values = await getSweepChecks(firearm, "20");
        expect(values).toEqual(["-97", "-77", "-57", "-37", "-17", "-7", "3", "13", "23", "27", "31", "35", "39", "41", "43", "45"]);
    });

    it ("counters sweep fire penalties with high FIT", async () => {
        const firearm = renderFirearmControlWithBurst({fit: 72});
        const values = await getSweepChecks(firearm, "10");
        expect(values).toEqual(["", "", "", "", "", "", "", "", "-16", "4", "24", "34", "44", "45", "45", "45"]);
    });

    it ("can remove firearm", async () => {
        const user = userEvent.setup()
        const spy = jest.fn().mockResolvedValue({})
        const firearm = renderFirearm({
            weapon: factories.firearmFactory({id: 5}),
            onRemove: spy
        });
        await user.click(firearm.getByRole("button", {name: "Remove firearm"}))
        expect(spy).toHaveBeenCalledWith({id: 5})
    });

    xit("can remove scope", test.todo)
});