import * as factories from "./factories";
import { testSetup } from "./testutils";
import CCWeaponModel from "CCWeaponModel";
import {UseType} from "../../react/WeaponModel";

describe("CCWeaponModel", function () {
  beforeAll(() => {
    testSetup();
  });
  beforeEach(() => {
    factories.skillFactory({
      name: "Weapon combat",
      stat: "MOV",
    });
    factories.skillFactory({
      name: "Greatsword",
      stat: "MOV",
    });
    factories.skillFactory({
      name: "Sword",
      stat: "MOV",
    });
  });
  afterEach(() => {
    factories.clearAll();
  });

  const createWeaponModel = ({ handler, weapon }) => {
    let handlerProps = {
      skills: [{skill__name: "Weapon combat", level: 0}],
      characterSkills: [],
      edges: [],
      character: { cur_fit: 45, cur_ref: 45, cur_int: 45 },
    };
    if (handler !== undefined) {
      handlerProps = Object.assign(handlerProps, handler);
    }

    // let allSkills = [];1
    // for (let skill of handlerProps.skills) {
    //   const filled = factories.skillFactory({
    //     name: skill.skill,
    //     stat: "MOV",
    //   });
    //   expect(filled.stat).toEqual("MOV");
    //   allSkills.push(filled);
    // }
    // handlerProps.allSkills = allSkills;

    return new CCWeaponModel(
      factories.skillHandlerFactory(handlerProps),
      factories.weaponFactory(weapon),
    );
  };

  it("can calculate effect of missing specialization skill checks", () => {
    const weapon = createWeaponModel({
      handler: {
        // skills: [
        //   {
        //     skill__name: "Weapon combat",
        //     level: 0,
        //   },
        // ],
      },
      weapon: {
        name: "Zweihänder",
        base: {
          name: "Two-handed",
          base_skill: "Weapon combat",
          required_skills: ["Greatsword"],
          ccv: 15,
          ccv_unskilled_modifier: -10,
        },
      },
    });
    expect(weapon.skillCheck().value()).toEqual(50);
  });

  it("takes secondary useType into account", () => {
    const weapon = createWeaponModel({handler: {}, weapon: {}});
    expect(weapon.skillCheck().value()).toEqual(45 + 13);

    expect(weapon.roa().value()).toEqual(1.0)
    expect(weapon.skillChecksV2([1,2,3]).map((v) => v?.value() || null)).toEqual([58, 28, null])

    expect(weapon.roa(UseType.SEC).value()).toEqual(0.5)
    const res = weapon.skillChecksV2([1,2,3], UseType.SEC);
    expect(res.map((v) => v?.value() || null)).toEqual([3, null, null])

  });

  it("ignores wrong hand-penalty with shields", () => {
    const weapon = createWeaponModel({handler: {}, weapon: {base: {is_shield: true}}});
    expect(weapon.roa(UseType.SEC).value()).toEqual(0.5)
    const res = weapon.skillChecksV2([1,2,3], UseType.SEC);
    expect(res.map((v) => v?.value() || null)).toEqual([28, null, null])
  });

});
