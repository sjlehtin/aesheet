import * as factories from './factories'

describe('SkillHandler', function() {

    it('calculates skill level', function () {
        const handler = factories.skillHandlerFactory({skills: [
            {skill: "Pistol", level: 1}]});

        expect(handler.skillLevel("Pistol")).toEqual(1);
        expect(handler.skillCheck("Pistol")).toEqual(48);
    });

    it('calculates skill check for zero cost skill', function () {
        const handler = factories.skillHandlerFactory({
            character: {cur_fit: 48},
            allSkills: [
            {name: "Endurance/run", level: 0, skill_cost_0: 0, stat: "FIT"}]});
        expect(handler.skillCheck("Endurance/run")).toEqual(48);
    });

    it('calculates unskilled check', function () {
        const handler = factories.skillHandlerFactory({
            skills: [{skill: {name: "Basic Firearms", skill_cost_1: null}, level: 0}],
            allSkills: [{
                name: "Pistol", required_skills: ["Basic Firearms"]}]
        });
        expect(handler.skillCheck("Pistol")).toEqual(22)
    });

    it('calculates extremely unskilled check', function () {
        const handler = factories.skillHandlerFactory({
            allSkills: [{
                name: "Pistol",
                required_skills: ["Basic Firearms"]}
                ]
        });
        expect(handler.skillCheck("Pistol")).toEqual(11)
    });
    
    it("mangles skill list to respect requirements order", function () {
        const handler = factories.skillHandlerFactory({
            skills: [
                {skill: "Naval Gunnery", level: 1},
                {skill: "Basic Artillery", level: 0},
                {skill: "Agriculture", level: 3}],
            allSkills: [
                {name: "Agriculture"},
                {name: "Basic Artillery"},
                {name: "Naval Gunnery",
                    required_skills: ["Basic Artillery"]}
        ]});

        const newList = handler.getSkillList();
        expect(newList[0].skill).toEqual("Agriculture");
    });

    it("finds missing skills while mangling from all requires", function () {
        const handler = factories.skillHandlerFactory({
            skills: [
                {skill: "Naval Gunnery", level: 1},
                {skill: "Basic Artillery", level: 0},
                {skill: "Agriculture", level: 3}],
            allSkills: [
                {name: "Agriculture"},
                {name: "Basic Artillery"},
                {name: "Naval Gunnery",
                    required_skills: ["Basic Artillery", "Gardening"]}
        ]});

        const newList = handler.getSkillList();
        expect(newList[2].skill).toEqual("Naval Gunnery");
        expect(newList[2]._missingRequired).toEqual(["Gardening"]);
    });

    it("does not choke on multiple required skills", function () {
        const handler = factories.skillHandlerFactory({
            skills: [
                {skill: "Florism", level: 1},
                {skill: "Aesthetism", level: 0},
                {skill: "Gardening", level: 0},
                {skill: "Agriculture", level: 3}],
            allSkills: [
                {name: "Agriculture"},
                {name: "Gardening",
                required_skills: ["Agriculture"]},
                {name: "Florism",
                required_skills: ["Gardening", "Aesthetism"]},
                {name: "Aesthetism"}
        ]});

        const newList = handler.getSkillList();

        expect(newList[0].skill).toEqual("Aesthetism");
        expect(newList[0].indent).toEqual(0);
        expect(newList[1].skill).toEqual("Agriculture");
        expect(newList[1].indent).toEqual(0);
        expect(newList[2].indent).toEqual(1);
        expect(newList[3].skill).toEqual("Florism");
        expect(newList[3].indent).toEqual(2);
    });


    it("calculates indent for nested required skills while mangling", function () {
        const handler = factories.skillHandlerFactory({
            skills: [
                {skill: "Florism", level: 1},
                {skill: "Gardening", level: 0},
                {skill: "Agriculture", level: 3}],
            allSkills: [
                {name: "Agriculture"},
                {name: "Gardening",
                required_skills: ["Agriculture"]},
                {name: "Florism",
                required_skills: ["Gardening"]}
        ]});

        const newList = handler.getSkillList();
        expect(newList[0].skill).toEqual("Agriculture");
        expect(newList[0].indent).toEqual(0);
        expect(newList[1].indent).toEqual(1);
        expect(newList[2].skill).toEqual("Florism");
        expect(newList[2].indent).toEqual(2);
    });

});