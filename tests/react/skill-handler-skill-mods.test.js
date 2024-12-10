import * as factories from './factories'
import {testSetup} from "./testutils";

describe('SkillHandler skill mods', function() {
    beforeAll(() => {
        testSetup()
    })
    beforeEach(() => {
        factories.clearAll()
        factories.skillFactory({name: "Climbing", stat: "MOV", affected_by_armor_mod_climb: true})
        factories.skillFactory({name: "Stealth", stat: "MOV", affected_by_armor_mod_stealth: true})
        factories.skillFactory({name: "Concealment", stat: "INT", affected_by_armor_mod_conceal: true})
        factories.skillFactory({name: "Swimming", stat: "MOV", affected_by_armor_mod_swim: true})
    })

    it('takes armor into account with climbing skill penalties', function () {
        const handler = factories.skillHandlerFactory({
            skills: [{skill: {name: "Climbing", stat: "MOV"}, level: 0}],
            character: {
                cur_fit: 45, cur_ref: 45
            },
            armor: {
                base: {
                    mod_climb: -10
                },
                quality: {
                    mod_climb: 5
                }
            },
        });
        expect(handler.skillCheck("Climbing").value()).toEqual(40);
    });

    it('caps armor quality penalty counter', function () {
        const handler = factories.skillHandlerFactory({
            skills: [{skill: {name: "Tail / Shadow", stat: "PSY"}, level: 0}],
            character: {
                cur_fit: 45, cur_ref: 45, cur_psy: 45
            },
            armor: {
                base: {
                    mod_psy: -5
                },
                quality: {
                    mod_psy: 10
                }
            },
        });
        expect(handler.skillCheck("Tail / Shadow").value()).toEqual(45);
    });

    it('does not cap armor quality bonus to skills', function () {
        const handler = factories.skillHandlerFactory({
            skills: [{skill: {name: "Climbing", stat: "MOV"}, level: 0}],
            character: {
                cur_fit: 45, cur_ref: 45, cur_psy: 45
            },
            armor: {
                base: {
                    mod_climb: -5
                },
                quality: {
                    mod_climb: 10
                }
            },
        });
        expect(handler.skillCheck("Climbing").value()).toEqual(50);
    });

    it('counts armor penalties in to the stealth skill check', function () {
        const handler = factories.skillHandlerFactory({
            character: {cur_fit: 45, cur_ref: 45},
            skills: [{skill: {name: "Stealth", stat: "MOV"}, level: 1}],
            armor: {
                base: {
                    mod_stealth: -5
                },
                quality: {
                    mod_stealth: 2
                }
            }
        });
        expect(handler.skillCheck("Stealth").value()).toEqual(47);
    });

    it('counts armor penalties in to the concealment skill check', function () {
        const handler = factories.skillHandlerFactory({
            character: {cur_int: 45},
            skills: [{skill: {name: "Concealment", stat: "INT"}, level: 2}],
            armor: {
                base: {
                    mod_conceal: -5
                },
                quality: {
                    mod_conceal: 1
                }
            }
        });
        expect(handler.skillCheck("Concealment").value()).toEqual(51);
    });

    it('counts armor penalties in to the swimming skill check', function () {
        const handler = factories.skillHandlerFactory({
            character: {cur_fit: 45, cur_ref: 45},
            skills: [{skill: {name: "Swimming", stat: "MOV"}, level: 2}],
            armor: {
                base: {
                    mod_swim: -5
                },
            }
        });
        expect(handler.skillCheck("Swimming").value()).toEqual(50);
    });
});