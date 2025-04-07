import * as factories from "./factories";
import { testSetup } from "./testutils";
import FirearmModel from "FirearmModel";
import { UseType } from "../../react/WeaponModel";

describe("FirearmModel", function () {
  beforeAll(() => {
    testSetup();
  });
  beforeEach(() => {
    factories.skillFactory({
      name: "Weapon combat",
      stat: "MOV",
    });
    factories.skillFactory({
      name: "Handguns",
      stat: "DEX",
    });
  });
  afterEach(() => {
    factories.clearAll();
  });

  const createWeaponModel = ({ handler, weapon, combat: givenCombat }) => {
    let handlerProps = {
      skills: [
        {
          skill__name: "Handguns",
          level: 0,
        },
        {
          skill__name: "Long guns",
          level: 0,
        },
        { skill__name: "Weapon combat", level: 0 },
      ],
      characterSkills: [],
      edges: [],
      character: { cur_fit: 45, cur_ref: 45, cur_int: 45 },
    };
    if (handler !== undefined) {
      handlerProps = Object.assign(handlerProps, handler);
    }
    const combat = Object.assign(
      {
        inCloseCombat: false,
        toRange: "",
        darknessDetectionLevel: 0,
      },
      givenCombat ?? {},
    );
    return new FirearmModel(
      factories.skillHandlerFactory(handlerProps),
      factories.firearmFactory(Object.assign({base: {autofire_rpm: 360}}, weapon)),
      combat.inCloseCombat,
      combat.toRange,
      combat.darknessDetectionLevel,
    );
  };

  test.todo("calculates half-skill shooting");

  it("calculates ranged attacks", () => {
    const weapon = createWeaponModel({ handler: {}, weapon: {} });
    expect(weapon.skillCheck().value()).toEqual(45);

    expect(weapon.rof().value()).toBeCloseTo(2.86);
    expect(
      weapon.skillChecksV2([1, 2, 3, 4, 5, 6]).map((v) => v?.value() || null),
    ).toEqual([48, 45, 39, 32, 25, null]);

    expect(weapon.rof(UseType.SEC).value()).toBeCloseTo(2.36);
    expect(weapon.oneHandedPenalty()).toBeCloseTo(-1.2);

    const res = weapon.skillChecksV2([1, 2, 3, 4, 5, 6], UseType.SEC);
    expect(res.map((v) => v?.value() || null)).toEqual([
      20,
      18,
      8,
      null,
      null,
      null,
    ]);
  });

  it("calculates CC checks for handgun", () => {
    const weapon = createWeaponModel({
      handler: {},
      weapon: {},
      combat: { inCloseCombat: true },
    });

    expect(weapon.oneHandedPenalty()).toBeCloseTo(-1.2);
    expect(weapon.ccv()).toBeCloseTo(18.8);

    expect(weapon.skillCheck().value()).toEqual(53.8);

    expect(weapon.rof().value()).toBeCloseTo(2.86);
    expect(weapon.roa().value()).toEqual(1.3);

    expect(
      weapon.skillChecksV2([1, 2, 3]).map((v) => v?.value() || null),
    ).toEqual([53, 37, null]);
    expect(weapon.initiatives([1, 2, 3], {})).toEqual([4, -7, null])

    expect(weapon.roa(UseType.SEC).value()).toBeCloseTo(0.8);

    const res = weapon.skillChecksV2([1, 2], UseType.SEC);
    expect(res.map((v) => v?.value() || null)).toEqual([17, null]);

    // Burst in CC
    expect(weapon.ccHits(UseType.FULL)).toEqual({single: 2, bursts: [3]})
    expect(weapon.defenseInitiatives([1, 2, 3], {})).toEqual([8, -4, -15])
    expect(weapon.weaponDamage({useType: UseType.FULL, defense: true})).toEqual({numDice: 1, dice: 4, extraDamage: 0, leth: 1, plusLeth: 0})
  });


  it("takes autofire only into account with CC hits", () => {
    const weapon = createWeaponModel({
      handler: {
        skills: [
          {
            skill__name: "Long guns",
            level: 0,
          },
        ],
      },
      weapon: { base: { base_skill: "Long guns", autofire_only: true, autofire_rpm: 360 } },
      combat: { inCloseCombat: true },
    });

    expect(weapon.ccHits(UseType.FULL)).toEqual({single: null, bursts: [3]})
  });

  it("takes Gun fu into account", () => {
    const weapon = createWeaponModel({
      handler: {
        skills: [
          {
            skill__name: "Handguns",
            level: 0,
          },
          {
            skill__name: "Gun fu",
            level: 0,
          },
        ],
      },
      weapon: {},
      combat: { inCloseCombat: true },
    });

    expect(weapon.oneHandedPenalty()).toBeCloseTo(-1.2);
    expect(weapon.ccv()).toBeCloseTo(18.8);

    expect(weapon.skillCheck().value()).toEqual(63.8);
  });

  it("takes high firearm skill into account for ROF in CC", () => {
    const weapon = createWeaponModel({
      handler: {
        skills: [
          {
            skill__name: "Handguns",
            level: 3,
          },
          {
            skill__name: "Gun fu",
            level: 0,
          },
        ],
      },
      weapon: {},
      combat: { inCloseCombat: true },
    });

    expect(weapon.skillCheck().value()).toEqual(63.8);
    expect(weapon.rof().value()).toBeCloseTo(3.72);
    expect(weapon.roa().value()).toEqual(1.3);
    expect(weapon.ccHits()).toEqual({single: 3, bursts: [3, 3]})
  });

  it("takes ammo weapon class modifier multiplier into account", () => {
    const weapon = createWeaponModel({
      weapon: {ammo: { weapon_class_modifier_multiplier: 2 }},
    });

    expect(weapon.rof().value()).toBeCloseTo(1.82);
  });

  it("gives different ROA for long guns and handguns", () => {
    const weapon = createWeaponModel({
      handler: {
        skills: [
          {
            skill__name: "Long guns",
            level: 0,
          },
        ],
      },
      weapon: { base: { base_skill: "Long guns" } },
      combat: { inCloseCombat: true },
    });

    expect(weapon.roa().value()).toBeCloseTo(1.1);
    expect(weapon.skillCheck().value()).toEqual(53.8);
    expect(weapon.rof().value()).toBeCloseTo(2.86);

    expect(weapon.defenseInitiatives([1, 2, 3], {})).toEqual([8, -6, -19])
  });

  it("takes high Long guns skill into account", () => {
    const weapon = createWeaponModel({
      handler: {
        skills: [
          {
            skill__name: "Long guns",
            level: 3,
          },
        ],
      },
      weapon: { base: { base_skill: "Long guns" } },
      combat: { inCloseCombat: true },
    });

    expect(weapon.roa().value()).toBeCloseTo(1.1);
    expect(weapon.skillCheck().value()).toEqual(53.8);
    expect(weapon.rof().value()).toBeCloseTo(3.72);

    expect(weapon.defenseInitiatives([1, 2, 3], {})).toEqual([8, -6, -19])
    expect(weapon.weaponDamage({useType: UseType.FULL, defense: true})).toEqual({numDice: 1, dice: 6, extraDamage: 0, leth: 3, plusLeth: 0})
  });

  test.todo("takes Two-weapon style into account in firearms akimbo case");

  test.todo("firearm modes");
});
