import React from 'react';
import {
    render,
    screen,
    waitFor,
    waitForElementToBeRemoved,
    within
} from '@testing-library/react'
import {rest} from 'msw'
import {setupServer} from 'msw/node'
import userEvent from '@testing-library/user-event'

import FirearmControl from 'FirearmControl'
import WeaponRow from 'WeaponRow'

import * as factories from './factories'

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

    const renderFirearm = async (givenProps) => {
        let props = {
            base: {base_skill: "Handguns", skill: "Pistol"},
            handlerProps: {
                character: {cur_int: 50, cur_ref: 50, cur_fit: 45, cur_psy: 50},
                skills: [{
                    skill: "Handguns",
                    level: 1
                }]
            },
            weapon: {
                base: {sight: 600, barrel_length: 602, accuracy: 1.0},
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
                const base = Object.assign({}, props.weapon.base, givenProps.weapon.base ?? {})
                props.weapon = Object.assign(props.weapon, givenProps.weapon);
                props.weapon.base = base
                delete givenProps.weapon;
            }
            props = Object.assign(props, givenProps);
        }
        const firearm = render(<FirearmControl {...factories.firearmControlPropsFactory(props)} />)
        await waitForElementToBeRemoved(() => screen.queryAllByRole("status"))

        return firearm
    }

    function getActionChecks() {
        let values = []
        screen.getByRole("row", {name: /Action/})
            .querySelectorAll('td').forEach((el) => values.push(el.textContent))
        return values.slice(3, 13);
    }

    function getInitiatives() {
        let values = []
        screen.getByRole("row", {name: /Initiatives/})
            .querySelectorAll('td').forEach((el) => values.push(el.textContent))
        return values.slice(1, 12);
    }

    it("can calculate single fire skill checks", async () => {
        await renderFirearm()

        expect(screen.getByLabelText("Rate of fire").textContent).toEqual("3.15")
        const values = getActionChecks();
        expect(values.slice(0, 8)).toEqual(["65", "58", "55", "55", "45", "38", "32", ""])
    });

    it("can calculate contact range effects", async () => {
        await renderFirearm({toRange: "0.4"});
        // Should get +60 from range
        const rangeEffect = screen.getByRole("row", {name: "Range effect"})
        expect(within(rangeEffect).getByLabelText("Check modifier").textContent).toEqual("+60")
        const values = getActionChecks();
        expect(values[0]).toEqual("125")

        expect(within(rangeEffect).getByLabelText("Target initiative modifier").textContent).toEqual("+2")
        expect(within(rangeEffect).getByLabelText("Damage modifier").textContent).toEqual("+2")
        expect(within(rangeEffect).getByLabelText("Lethality modifier").textContent).toEqual("+2")
        expect(within(rangeEffect).getByLabelText("Name").textContent).toEqual("Contact")
    });

    it("can calculate close range effects", async () => {
        await renderFirearm({toRange: "1"});
        const rangeEffect = screen.getByRole("row", {name: "Range effect"})
        expect(within(rangeEffect).getByLabelText("Check modifier").textContent).toEqual("+50")

        expect(within(rangeEffect).getByLabelText("Target initiative modifier").textContent).toEqual("+2")
        expect(within(rangeEffect).getByLabelText("Damage modifier").textContent).toEqual("+2")
        expect(within(rangeEffect).getByLabelText("Lethality modifier").textContent).toEqual("+2")
        expect(within(rangeEffect).getByLabelText("Name").textContent).toEqual("Close")
    });

    it("can calculate point-blank range effects", async () => {
        await renderFirearm({toRange: "3"});
        const rangeEffect = screen.getByRole("row", {name: "Range effect"})
        expect(within(rangeEffect).getByLabelText("Check modifier").textContent).toEqual("+40")

        expect(within(rangeEffect).getByLabelText("Target initiative modifier").textContent).toEqual("+1")
        expect(within(rangeEffect).getByLabelText("Damage modifier").textContent).toEqual("+1")
        expect(within(rangeEffect).getByLabelText("Lethality modifier").textContent).toEqual("+1")
        expect(within(rangeEffect).getByLabelText("Name").textContent).toEqual("Point-blank")
    });

    it("can calculate XXS range effects", async () => {
        await renderFirearm({toRange: "7"});
        const rangeEffect = screen.getByRole("row", {name: "Range effect"})
        expect(within(rangeEffect).getByLabelText("Check modifier").textContent).toEqual("+30")

        expect(within(rangeEffect).getByLabelText("Target initiative modifier").textContent).toEqual("+1")
        expect(within(rangeEffect).getByLabelText("Damage modifier").textContent).toEqual("+1")
        expect(within(rangeEffect).getByLabelText("Lethality modifier").textContent).toEqual("+1")
        expect(within(rangeEffect).getByLabelText("Name").textContent).toEqual("XXS")
    });

    it("can calculate extra-short range effects", async () => {
        await renderFirearm({toRange: "15"});
        const rangeEffect = screen.getByRole("row", {name: "Range effect"})
        expect(within(rangeEffect).getByLabelText("Check modifier").textContent).toEqual("+20")

        expect(within(rangeEffect).getByLabelText("Target initiative modifier").textContent).toEqual("+0")
        expect(within(rangeEffect).getByLabelText("Damage modifier").textContent).toEqual("+0")
        expect(within(rangeEffect).getByLabelText("Lethality modifier").textContent).toEqual("+0")
        expect(within(rangeEffect).getByLabelText("Name").textContent).toEqual("Extra-short")
    });

    it("can calculate very short range effects", async () => {
        await renderFirearm({toRange: "30"});
        const rangeEffect = screen.getByRole("row", {name: "Range effect"})
        expect(within(rangeEffect).getByLabelText("Check modifier").textContent).toEqual("+10")

        expect(within(rangeEffect).getByLabelText("Target initiative modifier").textContent).toEqual("+0")
        expect(within(rangeEffect).getByLabelText("Damage modifier").textContent).toEqual("+0")
        expect(within(rangeEffect).getByLabelText("Lethality modifier").textContent).toEqual("+0")
        expect(within(rangeEffect).getByLabelText("Name").textContent).toEqual("Very short")
    });

    it("can calculate short range effects", async () => {
        await renderFirearm({toRange: "60"});
        const rangeEffect = screen.getByRole("row", {name: "Range effect"})
        expect(within(rangeEffect).getByLabelText("Check modifier").textContent).toEqual("+0")

        expect(within(rangeEffect).getByLabelText("Target initiative modifier").textContent).toEqual("+0")
        expect(within(rangeEffect).getByLabelText("Damage modifier").textContent).toEqual("+0")
        expect(within(rangeEffect).getByLabelText("Lethality modifier").textContent).toEqual("+0")
        expect(within(rangeEffect).getByLabelText("Name").textContent).toEqual("Short")
    });

    it("can calculate medium range effects", async () => {
        await renderFirearm({toRange: "61"});
        const rangeEffect = screen.getByRole("row", {name: "Range effect"})
        expect(within(rangeEffect).getByLabelText("Check modifier").textContent).toEqual("-10")

        expect(within(rangeEffect).getByLabelText("Target initiative modifier").textContent).toEqual("+0")
        expect(within(rangeEffect).getByLabelText("Damage modifier").textContent).toEqual("+0")
        expect(within(rangeEffect).getByLabelText("Lethality modifier").textContent).toEqual("+0")
        expect(within(rangeEffect).getByLabelText("Name").textContent).toEqual("Medium")
    });

    it("can calculate long range effects", async () => {
        await renderFirearm({toRange: "180"});
        const rangeEffect = screen.getByRole("row", {name: "Range effect"})
        // Includes -5 for INT check
        expect(within(rangeEffect).getByLabelText("Check modifier").textContent).toEqual("-25")

        expect(within(rangeEffect).getByLabelText("Target initiative modifier").textContent).toEqual("+0")
        expect(within(rangeEffect).getByLabelText("Damage modifier").textContent).toEqual("+0")
        expect(within(rangeEffect).getByLabelText("Lethality modifier").textContent).toEqual("+0")
        expect(within(rangeEffect).getByLabelText("Name").textContent).toEqual("Long")
    });

    it("can calculate extra long range effects", async () => {
        await renderFirearm({toRange: "270"});
        const rangeEffect = screen.getByRole("row", {name: "Range effect"})
        // Includes -15 for INT check
        expect(within(rangeEffect).getByLabelText("Check modifier").textContent).toEqual("-45")

        expect(within(rangeEffect).getByLabelText("Target initiative modifier").textContent).toEqual("-1")
        expect(within(rangeEffect).getByLabelText("Damage modifier").textContent).toEqual("-1")
        expect(within(rangeEffect).getByLabelText("Lethality modifier").textContent).toEqual("-1")
        expect(within(rangeEffect).getByLabelText("Name").textContent).toEqual("Extra-long")
    });

    it("can calculate XXL range effects", async () => {
        await renderFirearm({toRange: "360"});
        const rangeEffect = screen.getByRole("row", {name: "Range effect"})
        // Includes -15 for INT check
        expect(within(rangeEffect).getByLabelText("Check modifier").textContent).toEqual("-55")

        expect(within(rangeEffect).getByLabelText("Target initiative modifier").textContent).toEqual("-2")
        expect(within(rangeEffect).getByLabelText("Damage modifier").textContent).toEqual("-2")
        expect(within(rangeEffect).getByLabelText("Lethality modifier").textContent).toEqual("-2")
        expect(within(rangeEffect).getByLabelText("Name").textContent).toEqual("XXL")
    });

    it("can calculate instinctive fire", async () => {
        await renderFirearm({
            handlerProps: {
                skills: [{
                    skill: "Handguns",
                    level: 1
                }, {skill: "Instinctive fire", level: 2}],
            },
            toRange: "25"
        });
        const rangeEffect = screen.getByRole("row", {name: "Range effect"})

        expect(within(rangeEffect).getByLabelText("Target initiative modifier").textContent).toEqual("+2")
    });

    it("recognizes INT for instinctive fire range", async () => {
        await renderFirearm({
            handlerProps: {
                skills: [{
                    skill: "Handguns",
                    level: 1
                }, {skill: "Instinctive fire", level: 2}],
            },
            toRange: "26"
        });
        const rangeEffect = screen.getByRole("row", {name: "Range effect"})

        expect(within(rangeEffect).getByLabelText("Target initiative modifier").textContent).toEqual("+0")
    });

    it("recognizes that target-I can not be positive", async () => {
        await renderFirearm({
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
        const rangeEffect = screen.getByRole("row", {name: "Range effect"})

        expect(within(rangeEffect).getByLabelText("Target initiative modifier").textContent).toEqual("+2")
        expect(screen.getByLabelText("Target initiative").textContent).toEqual("+0")
    });

    it("does not use instinctive fire for default range", async () => {
        await renderFirearm({
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
        const rangeEffect = screen.getByRole("row", {name: "Range effect"})

        expect(within(rangeEffect).getByLabelText("Target initiative modifier").textContent).toEqual("+0")
        expect(screen.getByLabelText("Target initiative").textContent).toEqual("-1")
    });

    it("renders damage with XXL range effects", async () => {
        await renderFirearm({toRange: "360"});
        expect(screen.getByLabelText("Damage").textContent).toContain("2d6+0/3 (+1)")
    });

    it("renders damage with XXL range effects", async () => {
        await renderFirearm({toRange: "0.3"});
        expect(screen.getByLabelText("Damage").textContent).toContain("2d6+4/7 (+1)")
    });

    it("renders even with impossible range", async () => {
        await renderFirearm({toRange: "20000"});
        const rangeEffect = screen.queryByRole("row", {name: "Range effect"})
        expect(rangeEffect).toBeNull()
        expect(screen.getByText("Unable to shoot to this range")).toBeTruthy()
        expect(screen.getByLabelText("Damage").textContent).toContain("range too long!")
    });

    it("renders even with impossible range and burst capable weapon", async () => {
        await renderFirearm({
            weapon:
                {base: {autofire_rpm: 600, autofire_class: "C"}},
            toRange: "20000"
        });
        const rangeEffect = screen.queryByRole("row", {name: "Range effect"})
        expect(rangeEffect).toBeNull()
        expect(screen.getByText("Unable to shoot to this range")).toBeTruthy()
        expect(screen.getByLabelText("Damage").textContent).toContain("range too long!")
    });

    it("recognizes darkness penalty makes extreme ranges shorter", async () => {
        await renderFirearm({
            darknessDetectionLevel: -3,
            toRange: "360"
        });

        const rangeEffect = screen.queryByRole("row", {name: "Range effect"})
        expect(rangeEffect).toBeNull()
    })

    it("calculates darkness penalty into range effects", async () => {
        await renderFirearm({darknessDetectionLevel: -3, toRange: "100"});

        const rangeEffect = screen.queryByRole("row", {name: "Range effect"})
        expect(within(rangeEffect).getByLabelText("Check modifier").textContent).toEqual("-65")
        expect(within(rangeEffect).getByLabelText("Name").textContent).toEqual("Medium")
    });

    it("calculate bumping based on range", async () => {
        await renderFirearm({toRange: "25"});

        const rangeEffect = screen.queryByRole("row", {name: "Range effect"})
        expect(within(rangeEffect).getByLabelText("Check modifier").textContent).toEqual("+10")
        expect(within(rangeEffect).getByLabelText("Bumping allowed").textContent).toEqual("no")
        expect(within(rangeEffect).getByLabelText("Name").textContent).toEqual("Very short")
    });

    it("takes Acute Vision 2 into account", async () => {
        await renderFirearm({
            weapon: {base: {sight: 600, barrel_length: 500, stock: 1.5, accuracy: 1.2},
                     ammo: {velocity: 900}},
            toRange: "300",
            handlerProps: { edges: [{edge: "Acute Vision", level: 2}]}
        });

        const rangeEffect = screen.queryByRole("row", {name: "Range effect"})
        expect(within(rangeEffect).getByLabelText("Name").textContent).toEqual("Long")
        expect(within(rangeEffect).getByLabelText("Vision check").textContent).toEqual("80")
        expect(within(rangeEffect).getByLabelText("Check modifier").textContent).toEqual("-20")

        expect(getActionChecks().slice(2, 7)).toEqual(["35", "28", "21", "13", ""])
    });

    it("takes Acute Vision 1 into account", async () => {
        await renderFirearm({
            weapon: {base: {sight: 600, barrel_length: 500, stock: 1.5, accuracy: 1.2},
                     ammo: {velocity: 900}},
            toRange: "300",
            handlerProps: { edges: [{edge: "Acute Vision", level: 1}]}
        });

        const rangeEffect = screen.queryByRole("row", {name: "Range effect"})
        expect(within(rangeEffect).getByLabelText("Name").textContent).toEqual("Long")
        expect(within(rangeEffect).getByLabelText("Vision check").textContent).toEqual("70")
        expect(within(rangeEffect).getByLabelText("Check modifier").textContent).toEqual("-25")

        expect(getActionChecks().slice(2, 7)).toEqual(["30", "23", "16", "8", ""])
    });

    it("takes Poor Vision into account", async () => {
        await renderFirearm({
            weapon: {base: {sight: 600, barrel_length: 500, stock: 1.5, accuracy: 1.2},
                     ammo: {velocity: 900}},
            toRange: "200", // 300 is too far
            handlerProps: { edges: [{edge: "Poor Vision", level: 2}]}
        });

        const rangeEffect = screen.queryByRole("row", {name: "Range effect"})
        expect(within(rangeEffect).getByLabelText("Name").textContent).toEqual("Long")
        expect(within(rangeEffect).getByLabelText("Vision check").textContent).toEqual("50")
        expect(within(rangeEffect).getByLabelText("Check modifier").textContent).toEqual("-45")

        expect(getActionChecks().slice(2, 7)).toEqual(["10", "3", "-4", "-12", ""])
    });

    it("takes scope's Acute Vision into account", async () => {
        await renderFirearm({
            weapon: {
                base: {
                    sight: 600,
                    barrel_length: 500,
                    stock: 1.5,
                    accuracy: 1.2
                },
                ammo: {velocity: 900},
                scope: {
                    name: "optical scope 8x",
                    sight: 1000,
                    perks: [{edge: "Acute Vision", level: 2}]
                }
            },
            toRange: "300",
        });

        const rangeEffect = screen.queryByRole("row", {name: "Range effect"})
        expect(within(rangeEffect).getByLabelText("Name").textContent).toEqual("Long")
        expect(within(rangeEffect).getByLabelText("Vision check").textContent).toEqual("80")
        expect(within(rangeEffect).getByLabelText("Check modifier").textContent).toEqual("-20")

        expect(getActionChecks().slice(2, 7)).toEqual(["35", "28", "21", "13", ""])
        expect(screen.getByText(/Acute Vision 2/)).toBeInTheDocument()
    });

    it("stacks scope and character's Poor Vision correctly", async () => {
        await renderFirearm({
            weapon: {
                base: {
                    sight: 600,
                    barrel_length: 500,
                    stock: 1.5,
                    accuracy: 1.2
                },
                ammo: {velocity: 900},
                scope: {
                    name: "optical scope 8x",
                    sight: 1000,
                    perks: [{edge: "Acute Vision", level: 2}]
                }
            },
            toRange: "300",
            handlerProps: {edges: [{edge: "Poor Vision", level: 1}]}
        });

        const rangeEffect = screen.queryByRole("row", {name: "Range effect"})
        expect(within(rangeEffect).getByLabelText("Name").textContent).toEqual("Long")
        expect(within(rangeEffect).getByLabelText("Vision check").textContent).toEqual("70")
        expect(within(rangeEffect).getByLabelText("Check modifier").textContent).toEqual("-25")

        expect(getActionChecks().slice(2, 7)).toEqual(["30", "23", "16", "8", ""])
    });

    it("stacks scope's and characters Acute Vision", async () => {
        await renderFirearm({
            weapon: {base: {sight: 600, barrel_length: 500, stock: 1.5, accuracy: 1.2},
                     ammo: {velocity: 900},
                scope: {name: "optical scope 8x", sight: 1000, perks: [{edge: "Acute Vision", level: 1}]}
            },
            handlerProps: { edges: [{edge: "Acute Vision", level: 1}]},
            toRange: "300",
        });

        const rangeEffect = screen.queryByRole("row", {name: "Range effect"})
        expect(within(rangeEffect).getByLabelText("Name").textContent).toEqual("Long")
        expect(within(rangeEffect).getByLabelText("Vision check").textContent).toEqual("80")
        expect(within(rangeEffect).getByLabelText("Check modifier").textContent).toEqual("-20")

        expect(getActionChecks().slice(2, 7)).toEqual(["35", "28", "21", "13", ""])
        expect(screen.getByText(/Acute Vision 1/)).toBeInTheDocument()
    });

    test.todo("allow specifying maximum range for scope/addon")
    test.todo('accounts for the Color blind flaw correctly in daylight')
    test.todo('ignores for the Color blind flaw correctly in night time')

    it ("can calculate a row of checks to implicit short range", async () => {
        await renderFirearm({
            weapon: {ammo: {weight: "7.450", velocity: 440}}
        })
        expect(screen.getByLabelText("Rate of fire").textContent).toEqual("3.16")
        const values = getActionChecks();
        expect(values).toEqual(["65", "58", "55", "55", "45", "38", "32", "",  "", ""])
    });

    it ("can calculate a row of checks to short range", async () => {
        await renderFirearm({
            toRange: "60",
            weapon: {ammo: {weight: "7.450", velocity: 440}}
        })
        expect(screen.getByLabelText("Rate of fire").textContent).toEqual("3.16")
        const values = getActionChecks();
        expect(values).toEqual(["65", "58", "55", "55", "45", "38", "32", "",  "", ""])
    });

    it ("can calculate a row of checks to medium range", async () => {
        await renderFirearm({
            toRange: "61",
            weapon: {ammo: {weight: "7.450", velocity: 440}}
        })
        expect(screen.getByLabelText("Rate of fire").textContent).toEqual("3.16")
        const values = getActionChecks();
        expect(values).toEqual(["55", "48", "45", "45", "35", "28", "22", "",  "", ""])
    });

    it ("can calculate a row of initiatives to short range", async () => {
        await renderFirearm({toRange: 60});

        const values = getInitiatives();
        expect(values).toEqual(["+9", "+7", "+3", "-2", "+6", "+1", "-4", "",  "", ""])
    });

    it ("can calculate a row of initiatives to extra-long range", async () => {
        await renderFirearm({toRange: 181});

        const values = getInitiatives();
        expect(values).toEqual(["+9", "+6", "+2", "-3", "+5", "+0", "-5", "",  "", ""])
    });

    it("can calculate effect of missing specialization skill checks", async () => {
        await renderFirearm({
            handlerProps: {
                skills: [{
                    skill: "Handguns",
                    level: 1
                }]
            },
            weapon: factories.firearmFactory({base: {base_skill: "Handguns", skill: "Pistol"}})});
        expect(screen.getByLabelText("Base check").textContent).toEqual("45")
    });

    it("can calculate skill check recognizing specializations", async () => {
        await renderFirearm({
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
        expect(screen.getByLabelText("Base check").textContent).toEqual("55")
    });

    it("calculates range for pistols", async () => {
        await renderFirearm({
            weapon: {base: {sight: 153, barrel_length: 102, accuracy: 1.0}},
        });
        expect(screen.getByLabelText("Short range").textContent).toEqual("12")
    });

    it("calculates range for pistols", async () => {
        await renderFirearm({
            weapon: {
                base: {sight: 153, barrel_length: 102, accuracy: 0.6},
                scope: {sight: 600}
            }
        });
        expect(screen.getByLabelText("Short range").textContent).toEqual("21")
    });

    it("calculates scope into target initiative", async () => {
        await renderFirearm({
            weapon: {base: {sight: 153, barrel_length: 102, accuracy: 0.6, target_initiative: -2},
            scope: {sight: 600, target_i_mod: -2}}
        });
        expect(screen.getByLabelText("Target initiative").textContent).toEqual("-4")
    });

    it("does not use sight equal to zero from scope, only initiative", async () => {
        await renderFirearm({
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
        expect(screen.getByLabelText("Short range").textContent).toEqual("12")
        expect(screen.getByLabelText("Target initiative").textContent).toEqual("-1")
    });

    it("calculates range for assault rifles", async () => {
        await renderFirearm({
            weapon: {base: {sight: 378, barrel_length: 415, accuracy: 1.0},
            scope: null}
        });
        expect(screen.getByLabelText("Short range").textContent).toEqual("39")
    });

    it("calculates range for a good SMG", async () => {
        await renderFirearm({
            weapon: {base: {sight: 340, barrel_length: 225, accuracy: 1.08},
                scope: null}
        });
        expect(screen.getByLabelText("Short range").textContent).toEqual("30")
    });

    it("calculates long range for pistols", async () => {
        await renderFirearm({
            weapon: {base: {stock: 1, barrel_length: 102, sight:153}, ammo: {velocity: 359}}
        });
        expect(screen.getByLabelText("Short range").textContent).toEqual("12")
        expect(screen.getByLabelText("Long range").textContent).toEqual("36")
    });

    it("calculates long range for assault rifles", async () => {
        await renderFirearm({
            weapon: {base: {stock: 1.25, barrel_length: 102, sight:153}, ammo: {velocity: 715}}
        });
        expect(screen.getByLabelText("Short range").textContent).toEqual("12")
        expect(screen.getByLabelText("Long range").textContent).toEqual("60")
    });

    it("calculates long range for sniper rifles", async () => {
        await renderFirearm({
            weapon: {base: {stock: 1.50, barrel_length: 102, sight:153}, ammo: {velocity: 900}}
        });
        expect(screen.getByLabelText("Short range").textContent).toEqual("12")
        expect(screen.getByLabelText("Long range").textContent).toEqual("72")
    });

    it ("calculates correct ROF", async () => {
        await renderFirearm({
            handlerProps: {
                skills: [{
                    skill: "Pistol",
                    level: 0
                }]},
            weapon: factories.firearmFactory({base: {base_skill: "Pistol"}})
        })

        expect(screen.getByLabelText("Rate of fire").textContent).toEqual("2.86")
    });

    it ("calculates correct ROF for higher skill level", async () => {
        await renderFirearm({
            handlerProps: {
                skills: [{
                    skill: "Pistol",
                    level: 3
                }]},
            weapon: factories.firearmFactory({base: {base_skill: "Pistol"}})
        })

        expect(screen.getByLabelText("Rate of fire").textContent).toEqual("3.72")
    });

    it ("can calculate a row of checks", async () => {
        await renderFirearm({
            handlerProps: {
                skills: [{
                    skill: "Pistol",
                    level: 0
                }]},
            weapon: factories.firearmFactory({base: {base_skill: "Pistol"}})
        })

        const values = getActionChecks();
        expect(values).toEqual(["60", "53", "50", "44", "37", "30", "", "",  "", ""])
    });

    it ("takes into account penalties countered", async () => {
        await renderFirearm({
            handlerProps: {
                skills: [{
                    skill: "Pistol",
                    level: 0
                }],
                character: {cur_int: 45, cur_ref: 45, cur_fit: 63}
            },
            weapon: factories.firearmFactory({base: {base_skill: "Pistol"}})
        })

        const values = getActionChecks();
        expect(values).toEqual(["55", "48", "45", "45", "38", "31", "", "",  "", ""])
    });

    it ("can calculate a row of initiatives", async () => {
        await renderFirearm({
            handlerProps: {
                character: {cur_int: 45, cur_ref: 45, cur_fit: 45,
                    cur_psy: 45},
                skills: [{
                    skill: "Pistol",
                    level: 0
                }]},
            weapon: factories.firearmFactory({base: {base_skill: "Pistol"}})
        })

        const values = getInitiatives();
        expect(values).toEqual(["+8", "+6", "+1", "-4", "+5", "-1", "", "",  "", ""])
    });


    it ("can render damage", async () => {
        await renderFirearm({
            weapon: factories.firearmFactory({ammo: {num_dice: 2,
                dice: 6,
                leth: 6,
                extra_damage: 3,
                plus_leth: -1}})
        });
        // Should get +60 from range
        expect(screen.getByLabelText("Damage").textContent).toEqual("2d6+3/6 (-1)")
    });

    const renderFirearmControlWithBurst = async (givenProps) => {
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
        const firearm = render(<FirearmControl {...factories.firearmControlPropsFactory({
            handlerProps: {
                skills: skills,
                character: {cur_ref: 45, cur_int: 45, cur_psy: 45,
                    cur_fit: props.fit}
            },
            toRange: props.toRange ?? "",
            weapon: factories.firearmFactory({
            base: {name: "Invented",
                autofire_rpm: props.autofireRPM,
                autofire_class: "B",
                sweep_fire_disabled: props.sweepFireDisabled,
                restricted_burst_rounds: props.restrictedBurstRounds,
                base_skill: "Long guns",
                sight: 600, barrel_length: 602, accuracy: 1.0
            }
        })})}/>);
        await waitForElementToBeRemoved(() => screen.queryAllByRole("status"))

        return firearm
    };


    async function getBurstChecks(burst) {
        const elems = await screen.findAllByLabelText(new RegExp(`Burst ${burst} To-Hit`))
        const values = elems.map((el) => {
            return el.textContent
        })
        return values;
    }

    it ("can calculate burst fire checks", async () => {
        await renderFirearmControlWithBurst();
        const values = await getBurstChecks(3);
        expect(values).toEqual(["39", "37", "33", "27", "19"]);
    });

    it ("can calculate burst fire checks for high FIT", async () => {
        await renderFirearmControlWithBurst({fit: 66});
        const values = await getBurstChecks(3);
        expect(values).toEqual(["45", "44", "40", "34", "26"]);
    });

    it ("does not negate bonus from low action count in bursts", async () => {
        await renderFirearmControlWithBurst({fit: 66});
        const values = await getBurstChecks(2);
        expect(values).toEqual(["48", "48", "48", "43", "35"]);
    });

    it ("takes missing Autofire skill into account", async () => {
        await renderFirearmControlWithBurst({fit: 66, hasAutofireSkill: false});
        const values = await getBurstChecks(2);
        expect(values).toEqual(["38", "38", "38", "33", "25"]);
    });

    it ("takes low RPM into account", async () => {
        await renderFirearmControlWithBurst({autofireRPM: 400});
        const values = await getBurstChecks(3);
        expect(values).toEqual(["39", "37", "33", "", ""]);
    });

    it ("takes restricted bursts into account", async () => {
        await renderFirearmControlWithBurst({restrictedBurstRounds: 3});
        const values = await getBurstChecks(3);
        expect(values).toEqual(["39", "37", "33", "", ""]);
    });

    async function getSweepChecks(sweep) {
        const elems = await screen.findAllByLabelText(new RegExp(`Sweep ${sweep} to-hit`))
        const values = elems.map((el) => {
            return el.textContent
        })
        return values;
    }

    it ("can render sweep fire", async () => {
        await renderFirearmControlWithBurst();
        const values = await getSweepChecks("20");
        expect(values).toEqual(["-87", "-67", "-47", "-27", "-7", "3", "13", "23", "33", "37", "41", "45", "49", "51", "53", "55"]);
    });

    it ("can render sweep fire with double range penalties", async () => {
        await renderFirearmControlWithBurst({toRange: 61});
        const values = await getSweepChecks("20");
        expect(values).toEqual(["-107", "-87", "-67", "-47", "-27", "-17", "-7", "3", "13", "17", "21", "25", "29", "31", "33", "35"]);
    });

    it ("does not render sweep fire if it is disabled", async () => {
        await renderFirearmControlWithBurst({sweepFireDisabled: true});
        const el = screen.queryAllByRole("table", {name: "Sweep fire to-hit"})
        expect(el).toEqual([])
    });

    it ("takes missing Autofire skill into account in sweep fire", async () => {
        await renderFirearmControlWithBurst({hasAutofireSkill: false});
        const values = await getSweepChecks("20");
        expect(values).toEqual(["-97", "-77", "-57", "-37", "-17", "-7", "3", "13", "23", "27", "31", "35", "39", "41", "43", "45"]);
    });

    it ("counters sweep fire penalties with high FIT", async () => {
        await renderFirearmControlWithBurst({fit: 72});
        const values = await getSweepChecks("10");
        expect(values).toEqual(["", "", "", "", "", "", "", "", "-16", "4", "24", "34", "44", "45", "45", "45"]);
    });

    it ("can remove firearm", async () => {
        const user = userEvent.setup()
        const spy = jest.fn().mockResolvedValue({})
        await renderFirearm({
            weapon: factories.firearmFactory({id: 5}),
            onRemove: spy
        });
        await user.click(screen.getByRole("button", {name: "Remove firearm"}))
        expect(spy).toHaveBeenCalledWith({id: 5})
    });

    it ("can change use type", async () => {
        const user = userEvent.setup()
        const spy = jest.fn().mockResolvedValue({})

        render(<FirearmControl weapon={factories.firearmFactory({id: 5, use_type: WeaponRow.PRI})}
                               skillHandler={factories.skillHandlerFactory()}
                               campaign={3}
                               onChange={spy} />)

        expect(screen.getByLabelText("Use type").textContent).toEqual("PRI")

        await user.click(screen.getByRole("combobox", {name: "Use type selection"}))

        await user.click(await screen.findByText(/Secondary/))

        expect(spy).toHaveBeenCalledWith({id: 5, use_type: "SEC"})

        await waitFor(() => expect(screen.getByLabelText("Use type").textContent).toEqual("SEC"))
    });

    it ("calculates correct ROF and checks for primary use type", async () => {
        await renderFirearm({
            handlerProps: {
                skills: [{
                    skill: "Pistol",
                    level: 0
                }]},
            weapon: factories.firearmFactory({
                base: {base_skill: "Pistol"},
                use_type: "PRI"
            })
        })

        expect(screen.getByLabelText("Rate of fire").textContent).toEqual("2.61")
        const values = getActionChecks();
        expect(values).toEqual(["60", "53", "50", "42", "34", "27", "", "",  "", ""])
    });

    it ("calculates correct ROF and checks for secondary use type", async () => {
        await renderFirearm({
            handlerProps: {
                skills: [{
                    skill: "Pistol",
                    level: 0
                }]},
            weapon: factories.firearmFactory({
                base: {base_skill: "Pistol"},
                use_type: "SEC"
            })
        })

        expect(screen.getByLabelText("Rate of fire").textContent).toEqual("2.36")
        const values = getActionChecks();
        expect(values).toEqual(["35", "27", "25", "15", "6", "", "", "",  "", ""])
    });

});