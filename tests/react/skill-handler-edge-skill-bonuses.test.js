import * as factories from './factories'

describe('SkillHandler edge skill bonuses', function() {

    it('handles a skill check without edges', function () {
        var handler = factories.skillHandlerFactory({skills: [
            {skill: "Surgery", level: 1}]});

        expect(handler.skillCheck("Surgery").value).toEqual((43 + 5));
    });

    it('accounts for Acute Touch', function () {
        var handler = factories.skillHandlerFactory({
            skills: [{skill: "Surgery", level: 1}],
            edges: [
                {
                    edge: {name: "Natural Climber"}, level: 1
                },
                {
                    edge: {name: "Acute Touch"}, level: 1,
                    edge_skill_bonuses: [
                        {skill: "Disable devices", bonus: 7},
                        {skill: "Surgery", bonus: 13},
                        {skill: "Field Surgery", bonus: 20},
                    ]
                },
                {
                    edge: {name: "Toughness"}, level: 2
                }]
        });

        expect(handler.skillCheck("Surgery").value).toEqual(43 + 5 + 13);
    });

});