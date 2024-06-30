jest.dontMock('SkillHandler');
jest.dontMock('sheet-util');
jest.dontMock('./factories');

var factories = require('./factories');


describe('SkillHandler stats', function() {
    "use strict";

    it('takes armor into account with climbing skill penalties', function () {
        var handler = factories.skillHandlerFactory({
            character: {
                cur_fit: 45, cur_ref: 45
            },
            armor: factories.armorFactory({
                base: {
                    mod_fit: -2,
                    mod_climb: -10
                },
                quality: {
                    mod_climb: 5
                }
            }),
        });
        expect(handler.getSkillMod("Climbing")).toEqual(-5);
    });

    it('caps armor quality penalty counter', function () {
        var handler = factories.skillHandlerFactory({
            armor: factories.armorFactory({
                base: {
                    mod_climb: -5
                },
                quality: {
                    mod_climb: 10
                }
            }),
        });
        expect(handler.getSkillMod("Climbing")).toEqual(0);
    });

    it('counts armor penalties in to the climbing skill check', function () {
        var handler = factories.skillHandlerFactory({
            character: {cur_fit: 45, cur_ref: 45},
            skills: [{skill: "Climbing", level: 1}],
            armor: factories.armorFactory({
                base: {
                    mod_climb: -5
                },
                quality: {
                    mod_climb: 0
                }
            })
        });
        expect(handler.skillCheckV2("Climbing", "mov").value).toEqual(45);
    });

    it('counts armor penalties in to the stealth skill check', function () {
        var handler = factories.skillHandlerFactory({
            character: {cur_fit: 45, cur_ref: 45},
            skills: [{skill: "Stealth", level: 1}],
            armor: factories.armorFactory({
                base: {
                    mod_stealth: -5
                },
                quality: {
                    mod_stealth: 2
                }
            })
        });
        expect(handler.skillCheckV2("Stealth", "mov").value).toEqual(47);
    });

    it('counts armor penalties in to the concealment skill check', function () {
        var handler = factories.skillHandlerFactory({
            character: {cur_fit: 45, cur_ref: 45},
            skills: [{skill: "Concealment", level: 2}],
            armor: factories.armorFactory({
                base: {
                    mod_conceal: -5
                },
                quality: {
                    mod_conceal: 1
                }
            })
        });
        expect(handler.skillCheckV2("Concealment", "mov").value).toEqual(51);
    });

    it('counts armor penalties in to the tumbling skill check', function () {
        var handler = factories.skillHandlerFactory({
            character: {cur_fit: 45, cur_ref: 45},
            skills: [{skill: "Tumbling", level: 2}],
            armor: factories.armorFactory({
                base: {
                    mod_tumble: -5
                },
            })
        });
        expect(handler.skillCheckV2("Tumbling", "ref").value).toEqual(50);
    });

});