import * as factories from './factories';


describe('SkillHandler movement rates', function() {

    it('calculates unskilled climbing speed', function () {
        var handler = factories.skillHandlerFactory();

        expect(handler.climbingSpeed().value()).toBeCloseTo(43/60);
    });

    it('calculates level 0 climbing speed', function () {
        var handler = factories.skillHandlerFactory({skills: [
            {skill: "Climbing", level: 0}]});

        expect(handler.climbingSpeed().value()).toBeCloseTo(43/30);
    });

    it('calculates level 3 climbing speed', function () {
        var handler = factories.skillHandlerFactory({skills: [
            {skill: "Climbing", level: 3}]});

        expect(handler.climbingSpeed().value()).toBeCloseTo(43/30 + 3);
    });

    it('accounts for Natural Climber edge', function () {
        var handler = factories.skillHandlerFactory({skills: [
            {skill: "Climbing", level: 3}],
            edges: [{edge: {name: "Natural Climber"}, level: 1, climb_multiplier: 2}]});

        expect(handler.climbingSpeed().value()).toBeCloseTo((43/30 + 3)*2);
    });

    it('accounts for Natural Climber edge and effect', function () {
        var handler = factories.skillHandlerFactory({skills: [
            {skill: "Climbing", level: 3}],
            edges: [{edge: {name: "Natural Climber"}, level: 1, climb_multiplier: 2}],
            effects: [{name: "Boots of climbing", climb_multiplier: 2}]
        });

        expect(handler.climbingSpeed().value()).toBeCloseTo((43/30 + 3)*2*2);
    });

     it('calculates unskilled swimming speed', function () {
        var handler = factories.skillHandlerFactory();

        expect(handler.swimmingSpeed().value()).toBeCloseTo(43/10);
    });

    it('calculates level 0 swimming speed', function () {
        var handler = factories.skillHandlerFactory({skills: [
            {skill: "Swimming", level: 0}]});

        expect(handler.swimmingSpeed().value()).toBeCloseTo(43/5);
    });

    it('calculates level 3 swimming speed', function () {
        var handler = factories.skillHandlerFactory({skills: [
            {skill: "Swimming", level: 3}]});

        expect(handler.swimmingSpeed().value()).toBeCloseTo(43/5 + 3*5);
    });

    it('accounts for Natural Swimmer edge', function () {
        var handler = factories.skillHandlerFactory({skills: [
            {skill: "Swimming", level: 3}],
            edges: [{edge: {name: "Natural Swimmer"}, level: 1, swim_multiplier: 2}]});

        expect(handler.swimmingSpeed().value()).toBeCloseTo((43/5 + 3*5)*2);
    });

    it('accounts for Natural Swimmer edge and effect', function () {
        var handler = factories.skillHandlerFactory({skills: [
            {skill: "Swimming", level: 3}],
            edges: [{edge: {name: "Natural Swimmer"}, level: 1, swim_multiplier: 2}],
            effects: [{name: "Boots of swimming", swim_multiplier: 2}]
        });

        expect(handler.swimmingSpeed().value()).toBeCloseTo((43/5 + 3*5)*2*2);
    });
   
    it('defaults to not flying', function () {
        var handler = factories.skillHandlerFactory();

        expect(handler.flyingSpeed().value()).toBeCloseTo(0);
    });

    it('allows flying effects', function () {
        var handler = factories.skillHandlerFactory({
            effects: [{name: "Wings of flying", fly_multiplier: 6}]
        });

        expect(handler.flyingSpeed().value()).toBeCloseTo(6*43);
    });

    it('calculates unskilled jumping distance', function () {
        var handler = factories.skillHandlerFactory();

        expect(handler.jumpingDistance().value()).toBeCloseTo(43/24);
    });

    it('takes high gravity into account', function () {
        const handler = factories.skillHandlerFactory({
            gravity: 2,
            character: {cur_fit: 60, cur_ref: 60}, skills: [
            {skill: "Jumping", level: 4}],
            allSkills: [
                {name: "Low-G maneuver"},
                {name: "High-G maneuver"},
            ],
            edges: [{name: "Fly, birdie, fly", fly_multiplier: 1}]
        });

        expect(handler.getEffStats().ref.value()).toEqual(60)

        expect(handler.sneakingSpeed().value()).toBeCloseTo(60/10);
        expect(handler.jumpingHeight().value()).toBeCloseTo(4/3);
        expect(handler.swimmingSpeed().value()).toBeCloseTo(60/20);
        expect(handler.flyingSpeed().value()).toBeCloseTo(60/2);
        expect(handler.climbingSpeed().value()).toBeCloseTo(0.5);
        expect(handler.runningSpeed().value()).toBeCloseTo(60/2);
        expect(handler.sprintingSpeed().value()).toBeCloseTo(60/2*1.5);

        expect(handler.getACPenalty().value).toEqual(-5)
    });

    it('takes low gravity into account', function () {
        const handler = factories.skillHandlerFactory({
            gravity: 0.5,
            character: {cur_fit: 60, cur_ref: 60}, skills: [
            {skill: "Jumping", level: 0}],
            allSkills: [
                {name: "Low-G maneuver"},
                {name: "High-G maneuver"},
            ],
            edges: [{name: "Fly, birdie, fly", fly_multiplier: 1}]
        });

        expect(handler.getEffStats().ref.value()).toEqual(47)
        expect(handler.getEffStats().mov.value()).toEqual(54)

        expect(handler.sneakingSpeed().value()).toBeCloseTo(108/5);
        expect(handler.jumpingHeight().value()).toBeCloseTo(3);
        expect(handler.swimmingSpeed().value()).toBeCloseTo(54/5);
        expect(handler.flyingSpeed().value()).toBeCloseTo(54*2);
        expect(handler.climbingSpeed().value()).toBeCloseTo(1.8);
        expect(handler.runningSpeed().value()).toBeCloseTo(108);
        expect(handler.sprintingSpeed().value()).toBeCloseTo(108*1.5);
    });

    it('takes zero gravity into account', function () {
        const handler = factories.skillHandlerFactory({
            gravity: 0,
            character: {
                cur_fit: 60,
                cur_ref: 72 /* counter ref penalty from low-gravity case */
            }, skills: [
            {skill: "Jumping", level: 0}],
            allSkills: [
                {name: "Low-G maneuver"},
                {name: "High-G maneuver"},
            ],
            edges: [{name: "Fly, birdie, fly", fly_multiplier: 1}]
        });

        expect(handler.getEffStats().ref.value()).toEqual(47)
        expect(handler.getEffStats().mov.value()).toEqual(54)

        expect(handler.sneakingSpeed().value()).toBeCloseTo(216/5);
        expect(handler.jumpingHeight().value()).toBeCloseTo(6);
        expect(handler.swimmingSpeed().value()).toBeCloseTo(108/5);
        expect(handler.flyingSpeed().value()).toBeCloseTo(54*4);
        expect(handler.climbingSpeed().value()).toBeCloseTo(3.6);
        expect(handler.runningSpeed().value()).toBeCloseTo(216);
        expect(handler.sprintingSpeed().value()).toBeCloseTo(216*1.5);
    });

    it('calculates level 0 jumping distance', function () {
        var handler = factories.skillHandlerFactory({skills: [
            {skill: "Jumping", level: 0}]});

        expect(handler.jumpingDistance().value()).toBeCloseTo(43/12);
    });

    it('calculates level 3 jumping distance', function () {
        var handler = factories.skillHandlerFactory({skills: [
            {skill: "Jumping", level: 3}]});

        expect(handler.jumpingDistance().value()).toBeCloseTo(43/12 + 3*0.75);
    });

    it('accounts for Natural Jumper edge', function () {
        var handler = factories.skillHandlerFactory({skills: [
            {skill: "Jumping", level: 3}],
            edges: [{edge: {name: "Natural Jumper"}, level: 1, run_multiplier: 2}]});

        expect(handler.jumpingDistance().value()).toBeCloseTo((43/12 + 3*0.75)*2);
    });

    it('accounts for Natural Jumper edge and effect', function () {
        var handler = factories.skillHandlerFactory({skills: [
            {skill: "Jumping", level: 3}],
            edges: [{edge: {name: "Natural Jumper"}, level: 1, run_multiplier: 2}],
            effects: [{name: "Boots of jumping", run_multiplier: 2}]
        });

        expect(handler.jumpingDistance().value()).toBeCloseTo((43/12 + 3*0.75)*2*2);
    });

    it('calculates jumping height', function () {
        var handler = factories.skillHandlerFactory({skills: [
            {skill: "Jumping", level: 3}]});

        expect(handler.jumpingHeight().value()).toBeCloseTo((43/12 + 3*0.75)/3);
    });

    it('calculates running speed', function () {
        var handler = factories.skillHandlerFactory({effects: [
            {name: "Boots of speed", run_multiplier: 2}]});

        expect(handler.runningSpeed().value()).toBeCloseTo(43 * 2);
    });

    it('calculates sprinting speed', function () {
        var handler = factories.skillHandlerFactory({effects: [
            {name: "Boots of speed", run_multiplier: 2}]});

        expect(handler.sprintingSpeed().value()).toBeCloseTo(43 * 2 * 1.5);
    });

    it('calculates sneaking speed', function () {
        // No effect from edges, effects to sneaking.
        var handler = factories.skillHandlerFactory({effects: [
            {name: "Boots of speed", run_multiplier: 2}]});

        expect(handler.sneakingSpeed().value()).toBeCloseTo(43/5);
    });

});