import React from 'react';

import RangedWeaponRow from "RangedWeaponRow";

import {render, screen} from '@testing-library/react'

import * as factories from './factories'

describe('RangedWeaponRow', function() {

    const renderWeaponRow = function (givenProps) {
        let handlerProps = {
            characterSkills: [],
            edges: [],
            stats: {mov: 45}
        };

        if (!givenProps) {
            givenProps = {};
        }

        if ('handlerProps' in givenProps) {
            handlerProps = Object.assign(handlerProps,
                givenProps.handlerProps);
            delete givenProps.handlerProps;
        }

        const weaponProps = givenProps.weaponProps;
        delete givenProps.weaponProps;

        const weapon = factories.rangedWeaponFactory(
                Object.assign({base: {base_skill: "Bow"}},
                    weaponProps ? weaponProps : {}));

        let allSkills = [];
        for (let skill of handlerProps.skills) {
            allSkills.push({
                name: skill.skill,
                stat: "dex"});
        }
        const addExtraSkill = function (skill) {
            if (skill) {
                allSkills.push({
                    name: skill,
                    stat: "dex"});
            }
        };

        addExtraSkill(weapon.base.base_skill);
        addExtraSkill(weapon.base.skill);
        addExtraSkill(weapon.base.skill2);

        handlerProps.allSkills = allSkills;

        let props = {
            weapon: weapon,
            skillHandler: factories.skillHandlerFactory(handlerProps)
        };

        props = Object.assign(props, givenProps);

        return render(<RangedWeaponRow {...props}/>)
    };

    it("caps ROF", function () {
        const weapon = renderWeaponRow({
            handlerProps: {
                skills: [{skill: "Bow", level: 5}],
            },
            weaponProps: {base: {roa: "4", base_skill: "Bow"}}
        });
        expect(weapon.getByLabelText("Rate of fire").textContent).toEqual("5.00")
    });

    it("takes Rapid archery into account", function () {
        const weapon = renderWeaponRow({
            handlerProps: {
                skills: [{skill: "Bow", level: 0},
                    {skill: "Rapid archery", level: 3}]
            },
            weaponProps: {base: {roa: "1.5", base_skill: "Bow"}}
        });
        expect(weapon.getByLabelText("Rate of fire").textContent).toEqual("1.65")
    });

    it("ignores Rapid archery for crossbows", function () {
        const weapon = renderWeaponRow({
            handlerProps: {
                skills: [
                    {skill: "Bow", level: 0},
                    {skill: "Rapid archery", level: 3}]
            },
            weaponProps: {base: {roa: "1.5", base_skill: "Crossbow"}}
        });
        expect(weapon.getByLabelText("Rate of fire").textContent).toEqual("1.50")
    });

    it("counters penalties with FIT", function () {
        const weapon = renderWeaponRow({
            handlerProps: {
                skills: [{skill: "Bow", level: 0}],
                character: {cur_ref: 45, cur_int: 45, cur_fit: 66}
            },
            weaponProps: {base: {roa: "1.5", base_skill: "Bow"}}
        });
        let values = []
        weapon.getByRole("row", {name: /Action/})
            .querySelectorAll('td').forEach((el) => values.push(el.textContent))
        expect(values.slice(4, 8)).toEqual(["45", "35", "22", ""])
    });

    it("does not give damage bonus for crossbows for high FIT", function () {
        const weapon = renderWeaponRow({
            handlerProps: {
                skills: [{skill: "Bow", level: 0}],
                character: {cur_ref: 45, cur_int: 45, cur_fit: 66}
            },
            weaponProps: {base: {roa: "1.5", base_skill: "Crossbow",
            num_dice: 1, dice: 6, extra_damage: 2, leth: 5, plus_leth: 1}}
        });
        expect(weapon.getByLabelText("Damage").textContent).toEqual("1d6+2/5+1")
    });

    it("gives damage bonus for bows for high FIT", function () {
        const weapon = renderWeaponRow({
            handlerProps: {
                skills: [{skill: "Bow", level: 0}],
                character: {cur_ref: 45, cur_int: 45, cur_fit: 66}
            },
            weaponProps: {base: {roa: "1.5", base_skill: "Bow",
            num_dice: 1, dice: 6, extra_damage: 2, leth: 5, plus_leth: 1}}
        });
        expect(weapon.getByLabelText("Damage").textContent).toEqual("1d6+4/5+1")
    });

    it("caps FIT bonus", function () {
        const weapon = renderWeaponRow({
            handlerProps: {
                skills: [{skill: "Bow", level: 0}],
                character: {cur_ref: 45, cur_int: 45, cur_fit: 190}
            },
            weaponProps: {base: {roa: "1.5", base_skill: "Bow",
            num_dice: 1, dice: 6, extra_damage: 2, leth: 5, plus_leth: 1},
                quality: {max_fit: 100}}
        });
        expect(weapon.getByLabelText("Damage").textContent).toEqual("1d6+7/6+1")
    });

    it("renders range without passed gravity prop", function () {

        const props = {
            handlerProps: {
                skills: [{skill: "Bow", level: 0}],
                character: {cur_ref: 45, cur_int: 45, cur_fit: 66}
            },
            weaponProps: {
                base: {
                    roa: "1.5",
                    base_skill: "Bow",
                    range_s: 5,
                    range_m: 20,
                    range_l: 30
                }
            },
        };
        renderWeaponRow(props)

        expect(screen.getByLabelText("Short range").textContent).toEqual("5");
    })

    it("halves range in high gravity", function () {

        const props = {
            handlerProps: {
                skills: [{skill: "Bow", level: 0}],
                character: {cur_ref: 45, cur_int: 45, cur_fit: 66}
            },
            weaponProps: {
                base: {
                    roa: "1.5",
                    base_skill: "Bow",
                    range_s: 5,
                    range_m: 20,
                    range_l: 30 }
            },
        };
        renderWeaponRow(Object.assign({gravity: 2.0}, props));
        expect(screen.getByLabelText("Short range").textContent).toEqual("2")
        expect(screen.getByLabelText("Medium range").textContent).toEqual("10")
        expect(screen.getByLabelText("Long range").textContent).toEqual("15")
    });

});