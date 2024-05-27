import React from 'react';
import WeaponRow from 'WeaponRow'
import { screen, render } from '@testing-library/react'
import * as factories from './factories'

describe('WeaponRow', function() {

    const renderWeaponRow = (givenProps) => {
        let handlerProps = {
            characterSkills: [],
            edges: [],
            character: {cur_fit: 45, cur_ref: 45}
        };
        if (givenProps && 'handlerProps' in givenProps) {
            handlerProps = Object.assign(handlerProps,
                givenProps.handlerProps);
            delete givenProps.handlerProps;
        }

        let allSkills = [];
        for (let skill of handlerProps.skills) {
            allSkills.push({
                name: skill.skill,
                stat: "mov"});
        }
        handlerProps.allSkills = allSkills;

        let props = {
            weapon: factories.weaponFactory(
                {base: {base_skill: "Weapon combat"}}),
            skillHandler: factories.skillHandlerFactory(handlerProps)
        };
        if (givenProps) {
            props = Object.assign(props, givenProps);
        }

        return render(<WeaponRow {...props}/>)
    };

    it("can calculate effect of missing specialization skill checks",
        () => {
            renderWeaponRow({
                handlerProps: {
                    skills: [{
                        skill: "Weapon combat",
                        level: 0
                    }]
                },
                weapon: factories.weaponFactory({
                    base: {
                        base_skill: "Weapon combat",
                        skill: "Greatsword",
                        ccv: 15,
                        ccv_unskilled_modifier: -10
                    }
                })
            });
            expect(screen.getByLabelText("Base check").textContent).toEqual("50")
        });

    it("notices specializations", function () {
        renderWeaponRow({
            handlerProps: {
                skills: [{
                        skill: "Greatsword",
                        level: 1
                    },
                    {
                        skill: "Weapon combat",
                        level: 1
                    }]
            },
            weapon: factories.weaponFactory({
                base: {
                    base_skill: "Weapon combat",
                    skill: "Greatsword",
                    ccv: 15,
                    ccv_unskilled_modifier: -10
                }
            })
        });
        expect(screen.getByLabelText("Base check").textContent).toEqual("65")
    });

    it("calculates correct ROA for full", function () {
         renderWeaponRow({
            handlerProps: {
                skills: [{
                    skill: "Weapon combat",
                    level: 3
                }]
            },
            weapon: factories.weaponFactory({
                base: {base_skill: "Weapon combat", roa: "1.5"}})
        });
        expect(screen.getByLabelText("ROA for FULL").textContent).toEqual("1.95")
    });

    const renderWeapon = function (givenProps) {
        let props = {roa: "1.5", size: 1, ccv: 10, skillLevel: 0, fit: 45,
            int: 45, extraSkills: [], edges: [], quality: {}, base: {}};
        if (givenProps) {
            props = Object.assign(props, givenProps);
        }

        let skills = [{
            skill: "Weapon combat",
            level: props.skillLevel
        }];

        for (let skill of props.extraSkills) {
            skills.push(skill);
        }

        const base = Object.assign({
            base_skill: "Weapon combat", roa: props.roa,
            ccv: props.ccv, num_dice: 2, dice: 6, extra_damage: 2,
            leth: 5, plus_leth: 1, defense_leth: 6, durability: 7,
            draw_initiative: -3, dp: 7, weight: 3.6}, props.base);

        return renderWeaponRow({
            handlerProps: {
                skills: skills,
                edges: props.edges,
                character: {cur_ref: 45, cur_int: props.int, cur_fit: props.fit}
            },
            weapon: factories.weaponFactory({
                base: base,
                quality: props.quality,
                size: props.size})
        });
    };

    it("calculates correct ROA for a large weapon", function () {
        renderWeapon({size: 2});
        expect(screen.getByLabelText("ROA for FULL").textContent).toEqual("1.35")
    });

    it("calculates correct ROA for FULL use", function () {
        renderWeapon();
        expect(screen.getByLabelText("ROA for FULL").textContent).toEqual("1.50")
    });

    it("calculates correct ROA for PRI use", function () {
        renderWeapon();
        expect(screen.getByLabelText("ROA for PRI").textContent).toEqual("1.25")
    });

    it("calculates correct ROA for SEC use", function () {
        renderWeapon();
        expect(screen.getByLabelText("ROA for SEC").textContent).toEqual("1.00")
    });

    it("calculates very high two-weapon style effect correctly", function () {
        // Even 6th level TWS should only counter the PRI penalty,
        // not give an actual bonus.
        renderWeapon({
            extraSkills: [{skill: "Two-weapon style", level: 6}]
        });
        expect(screen.getByLabelText("ROA for PRI").textContent).toEqual("1.50")
        expect(screen.getByLabelText("ROA for SEC").textContent).toEqual("1.30")
    });

    it("caps roa", function () {
        renderWeapon({skillLevel: 5, roa: 2.0});
        expect(screen.getByLabelText("ROA for FULL").textContent).toEqual("2.50")
    });

    it("takes Single-weapon style into account", function () {
        renderWeapon({
            extraSkills: [{skill: "Single-weapon style", level: 3}]
        });
        expect(screen.getByLabelText("ROA for FULL").textContent).toEqual("1.65")
    });

    it("stacks SWS and WC", function () {
        renderWeapon({
            skillLevel: 5,
            extraSkills: [{skill: "Single-weapon style", level: 3}]
        });
        expect(screen.getByLabelText("ROA for FULL").textContent).toEqual("2.47")
    });

    function getChecks(name) {
        let values = []
        screen.getAllByRole("cell", {name: name}).forEach((el) => values.push(el.textContent))
        return values
    }

    it("calculates skill checks for full use", function () {
        renderWeapon();
        expect(getChecks("Attack for FULL")).toEqual(["60", "55", "55", "38", "32", "25", "", "", ""])
    });

    it("calculates skill checks for primary use", function () {
        renderWeapon();
        expect(getChecks("Attack for PRI")).toEqual(["60", "55", "41", "33", "25", "", "", "", ""])
    });

    it("calculates skill checks for secondary use", function () {
        renderWeapon();
        expect(getChecks("Attack for SEC")).toEqual(["35", "30", "10", "0", "", "", "", "", ""])
    });

    it("takes Ambidexterity into account in secondary skill checks", function () {
        renderWeapon({edges: [{edge: {name: "Ambidexterity"}, level: 3}]});
        expect(getChecks("Attack for SEC")).toEqual(["50", "45", "25", "15", "", "", "", "", ""])
    });

    it("counters penalty for high INT", function () {
        renderWeapon({int: 66});
        expect(getChecks("Attack for FULL")).toEqual(["60", "55", "55", "45", "39", "32", "", "", ""])
    });

    it("calculates initiatives for full use", function () {
        renderWeapon();
        expect(getChecks("Attack initiative for FULL")).toEqual(["+6", "-4", "-14", ""])
    });

    it("calculates initiatives for primary use", function () {
        renderWeapon();
        expect(getChecks("Attack initiative for PRI")).toEqual(["+5", "-7", "", ""])
    });

    it("calculates initiatives for secondary use", function () {
        renderWeapon();
        expect(getChecks("Attack initiative for SEC")).toEqual(["+4", "-11", "", ""])
    });

    it("calculates defense initiatives for full use", function () {
        renderWeapon();
        expect(getChecks("Defense initiative for FULL")).toEqual(["+9", "-1", "-11"])
    });

    it("calculates defense initiatives for primary use", function () {
        renderWeapon();
        expect(getChecks("Defense initiative for PRI")).toEqual(["+9", "-3", "-15"])
    });

    it("calculates defense initiatives for secondary use", function () {
        renderWeapon();
        expect(getChecks("Defense initiative for SEC")).toEqual(["+9", "-6", "-21"])
    });

    it("calculates damage", function () {
        renderWeapon();
        expect(screen.getByLabelText("Attack damage for FULL").textContent).toEqual("2d6+2/5+1")
    });

    it("calculates damage with odd number fit", function () {
        renderWeapon({fit: 58});
        expect(screen.getByLabelText("Attack damage for FULL").textContent).toEqual("2d6+3/5+1")
    });

    it("calculates damage with quality", function () {
        renderWeapon({
            quality: {
                damage: 3, leth: 1,
                plus_leth: 1
            }
        });
        expect(screen.getByLabelText("Attack damage for FULL").textContent).toEqual("2d6+5/6+2")
    });

    it("calculates defense damage", function () {
        renderWeapon();
        expect(screen.getByLabelText("Defense damage for FULL").textContent).toEqual("2d6+2/6")
    });

    it("calculates defense damage with quality", function () {
        renderWeapon({quality: {damage: 3, leth: 1,
            plus_leth: 1, defense_leth: 1}});
        expect(screen.getByLabelText("Defense damage for FULL").textContent).toEqual("2d6+5/7")
    });

    // Damage capping
    // Lethality capping
    it("caps damage and lethality, base case", function () {
        renderWeapon({quality: {damage: 1}, base: {num_dice: 1}});
        expect(screen.getByLabelText("Attack damage for FULL").textContent).toEqual("1d6+3/5+1")
    })

    it("caps damage and lethality", function () {
        renderWeapon({quality: {damage: 1}, base: {num_dice: 1},
            fit: 180});
        expect(screen.getByLabelText("Attack damage for FULL").textContent).toEqual("1d6+12/8+1")
    });

    it("takes martial arts expertise into account", function () {
        renderWeapon({quality: {damage: 1}, base: {num_dice: 1},
        extraSkills: [{skill: "Martial arts expertise", level: 6}]});
        expect(screen.getByLabelText("Attack damage for FULL").textContent).toEqual("1d6+7/6+1")
    });

    // Size

    it("takes size into account with damage", function () {
        renderWeapon({size: 2, quality: {damage: 1}});
        expect(screen.getByLabelText("Attack damage for FULL").textContent).toEqual("4d6+5/6+1")
    });

    it("takes size into account with defense damage", function () {
        renderWeapon({size: 2, base: {defense_leth: 6},
            quality: {damage: 1}});
        expect(screen.getByLabelText("Defense damage for FULL").textContent).toEqual("4d6+5/7")
    });

    it("takes size into account with durabibility", function () {
        renderWeapon({size: 2});
        expect(screen.getByLabelText("Durability").textContent).toEqual("9")
    });

    it("takes large size into account with damagae points", function () {
        renderWeapon({size: 2});
        expect(screen.getByLabelText("Damage points").textContent).toEqual("14")
    });

    it("takes huge size into account with damagae points", function () {
        renderWeapon({size: 3});
        expect(screen.getByLabelText("Damage points").textContent).toEqual("28")
    });

    it("takes large size into account with draw initiative", function () {
        renderWeapon({size: 2});
        expect(screen.getByLabelText("Draw initiative").textContent).toEqual("-5")
    });

    it("takes large size into account with CCV", function () {
        renderWeapon({size: 2});
        expect(screen.getByLabelText("Close combat value").textContent).toEqual("15")
    });

    it("takes huge size into account with CCV", function () {
        renderWeapon({size: 3});
        expect(screen.getByLabelText("Close combat value").textContent).toEqual("20")
    });

    it("takes large size into account with bypass", function () {
        renderWeapon({size: 2});
        expect(screen.getByLabelText("Bypass").textContent).toEqual("-2")
    });

    it("shows weight", function () {
        renderWeapon({size: 1});
        expect(screen.getByLabelText("Weight").textContent).toEqual("3.60 kg")
    });

    it("takes large size into account with weight", function () {
        renderWeapon({size: 2});
        expect(screen.getByLabelText("Weight").textContent).toEqual("10.80 kg")
    });

    it("takes huge size into account with weight", function () {
        renderWeapon({size: 3});
        expect(screen.getByLabelText("Weight").textContent).toEqual("32.40 kg")
    });

    it("observes weapon One-handed use requirement", function () {
        renderWeapon({size: 2, base: {skill2: "One-handed use"}});

        expect(screen.getByRole("row", {name: "Action row for FULL"}).textContent).not.toMatch(/Unskilled/)
        expect(screen.getByRole("row", {name: "Action row for PRI"}).textContent).toMatch(/Unskilled/)
        expect(screen.getByRole("row", {name: "Action row for SEC"}).textContent).toMatch(/Unskilled/)
    });


    // Special damage

    // TODO: Lance damage on charge.
});