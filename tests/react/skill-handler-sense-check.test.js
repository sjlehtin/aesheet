import * as factories from './factories'
import {testSetup} from "./testutils";

describe('SkillHandler edge skill bonuses', function() {
    beforeAll(() => {
        testSetup()
    })
    afterEach(() => {
        factories.clearAll()
    })

    it('handles plain surprise check', function () {
        const handler = factories.skillHandlerFactory({character: {cur_psy: 50}});

        expect(handler.surpriseCheck()).toEqual(50);
    });

    it('recognizes Night Vision for detection level', function () {
        const handler = factories.skillHandlerFactory({character: {cur_int: 50},
        edges: [{edge: "Night Vision", level: 1}]});

        const actual = handler.nightVisionBaseCheck();
        expect(actual.check.value()).toEqual(50)
        expect(actual.darknessDetectionLevel).toEqual(1)
        expect(actual.detectionLevel).toEqual(0)
    });

    it('recognizes Night Blindness for detection level', function () {
        const handler = factories.skillHandlerFactory({character: {cur_int: 50},
        edges: [{edge: "Night Blindness", level: 1}]});

        const actual = handler.nightVisionBaseCheck();
        expect(actual.check.value()).toEqual(50)
        expect(actual.darknessDetectionLevel).toEqual(-1)
        expect(actual.detectionLevel).toEqual(0)
    });

    it('handles skill night vision modifiers', function () {
        const handler = factories.skillHandlerFactory({
                            character: {cur_int: 50},
                            skills: [{skill: "Search", level: 1}]});

        const actual = handler.nightVisionBaseCheck();
        expect(actual.check.value()).toEqual(55)
        expect(actual.darknessDetectionLevel).toEqual(0)
        expect(actual.detectionLevel).toEqual(0)
    });

    it('recognizes Acute Vision for detection level in night vision', function () {
        const handler = factories.skillHandlerFactory({character: {cur_int: 50},
        edges: [{edge: "Acute Vision", level: 3}]});

        const actual = handler.nightVisionBaseCheck();
        expect(actual.check.value()).toEqual(50)
        expect(actual.darknessDetectionLevel).toEqual(0)
        expect(actual.detectionLevel).toEqual(1)
    });

    it('correctly rounds Acute Vision down for detection level', function () {
        const handler = factories.skillHandlerFactory({character: {cur_int: 50},
        edges: [{edge: "Acute Vision", level: 1}]});

        const actual = handler.nightVisionBaseCheck();
        expect(actual.check.value()).toEqual(50)
        expect(actual.darknessDetectionLevel).toEqual(0)
        expect(actual.detectionLevel).toEqual(0)
    });

    it('handles Acute Vision and Night Vision in detection level', function () {
        const handler = factories.skillHandlerFactory({character: {cur_int: 50},
        edges: [{edge: "Acute Vision", level: 2}, {edge: "Night Vision", level: 1}]});

        const actual = handler.nightVisionBaseCheck();
        expect(actual.check.value()).toEqual(50)
        expect(actual.darknessDetectionLevel).toEqual(1)
        expect(actual.detectionLevel).toEqual(1)
    });

    it('adds Poor Vision and Night Vision for detection level', function () {
        const handler = factories.skillHandlerFactory({character: {cur_int: 50},
        edges: [{edge: "Poor Vision", level: 2}, {edge: "Night Vision", level: 1}]});

        const actual = handler.nightVisionBaseCheck();
        expect(actual.check.value()).toEqual(50)
        expect(actual.darknessDetectionLevel).toEqual(1)
        expect(actual.detectionLevel).toEqual(-1)
    });

    it('recognizes Acute Vision for detection level', function () {
        const handler = factories.skillHandlerFactory({character: {cur_int: 50},
        edges: [{edge: "Acute Vision", level: 1}]});

        const actual = handler.dayVisionBaseCheck();
        expect(actual.check.value()).toEqual(50)
        expect(actual.darknessDetectionLevel).toEqual(0)
        expect(actual.detectionLevel).toEqual(1)
    });

    it('handles Color Blind', function () {
        const handler = factories.skillHandlerFactory({character: {cur_int: 50},
        edges: [{edge: "Color Blind", level: 1}]});

        const actual = handler.dayVisionBaseCheck();
        expect(actual.check.value()).toEqual(45)
        expect(actual.darknessDetectionLevel).toEqual(0)
        expect(actual.detectionLevel).toEqual(0)
    });

    it('recognizes Poor Vision for detection level', function () {
        const handler = factories.skillHandlerFactory({character: {cur_int: 50},
        edges: [{edge: "Poor Vision", level: 1}]});

        const actual = handler.dayVisionBaseCheck();
        expect(actual.check.value()).toEqual(50)
        expect(actual.darknessDetectionLevel).toEqual(0)
        expect(actual.detectionLevel).toEqual(-1)
    });

    it('handles edge vision modifiers', function () {
        const handler = factories.skillHandlerFactory({character: {cur_int: 50},
        edges: [{edge: "Peripheral Vision", level: 1, vision: 5}]});

        const actual = handler.dayVisionBaseCheck();
        expect(actual.check.value()).toEqual(55)
        expect(actual.darknessDetectionLevel).toEqual(0)
        expect(actual.detectionLevel).toEqual(0)
    });

    it('handles armor vision modifiers', function () {
        const handler = factories.skillHandlerFactory({
                            character: {cur_int: 50},
                            armor: {base: {mod_vision: -5}}});

        const actual = handler.dayVisionBaseCheck();
        expect(actual.check.value()).toEqual(45)
        expect(actual.darknessDetectionLevel).toEqual(0)
        expect(actual.detectionLevel).toEqual(0)
    });

    it('handles skill day vision modifiers', function () {
        const handler = factories.skillHandlerFactory({
                            character: {cur_int: 50},
                            skills: [{skill: "Search", level: 1}]});

        const actual = handler.dayVisionBaseCheck();
        expect(actual.check.value()).toEqual(55)
        expect(actual.darknessDetectionLevel).toEqual(0)
        expect(actual.detectionLevel).toEqual(0)
    });

    it('handles edge surprise modifiers', function () {
        const handler = factories.skillHandlerFactory({character: {cur_psy: 50},
        edges: [{edge: "Peripheral Vision", level: 1, surprise: 5}]});

        expect(handler.surpriseCheck()).toEqual(55);
    });

    it('handles armor surprise modifiers', function () {
        const handler = factories.skillHandlerFactory({
                            character: {cur_psy: 50},
                            armor: {base: {mod_surprise: -5}}});
        expect(handler.surpriseCheck()).toEqual(45);
    });

    it('handles skill surprise modifiers', function () {
        const handler = factories.skillHandlerFactory({
                            character: {cur_psy: 50},
                            skills: [{skill: "Tailing / Shadowing", level: 1}]});
        expect(handler.surpriseCheck()).toEqual(55);
    });

    it('handles edge smell modifiers', function () {
        const handler = factories.skillHandlerFactory({character: {cur_int: 50},
        edges: [{edge: "Excellent Cook", level: 1, smell: 5}]});

        const actual = handler.smellCheck();
        expect(actual.check.value()).toEqual(55)
        expect(actual.detectionLevel).toEqual(0)
    });

    it('handles armor smell modifiers', function () {
        const handler = factories.skillHandlerFactory({
                            character: {cur_int: 50},
                            armor: {base: {mod_smell: -5}}});

        const actual = handler.smellCheck();
        expect(actual.check.value()).toEqual(45)
        expect(actual.detectionLevel).toEqual(0)
    });

    it('handles skill smell modifiers', function () {
        const handler = factories.skillHandlerFactory({character: {cur_int: 50},
        skills: [{skill: "Search", level: 1}]});

        const actual = handler.smellCheck();
        expect(actual.check.value()).toEqual(55)
        expect(actual.detectionLevel).toEqual(0)
    });

    it('recognizes Acute Smell and Taste for detection level', function () {
        const handler = factories.skillHandlerFactory({character: {cur_int: 50},
        edges: [{edge: "Acute Smell and Taste", level: 1}]});

        const actual = handler.smellCheck();
        expect(actual.check.value()).toEqual(50)
        expect(actual.detectionLevel).toEqual(1)
    });

    it('recognizes Poor Smell and Taste for detection level', function () {
        const handler = factories.skillHandlerFactory({character: {cur_int: 50},
        edges: [{edge: "Poor Smell and Taste", level: 1}]});

        const actual = handler.smellCheck();
        expect(actual.check.value()).toEqual(50)
        expect(actual.detectionLevel).toEqual(-1)
    });

    it('handles edge hearing modifiers', function () {
        const handler = factories.skillHandlerFactory({character: {cur_int: 50},
        edges: [{edge: "Apt Hunter", level: 1, hear: 5}]});

        const actual = handler.hearingCheck();
        expect(actual.check.value()).toEqual(55)
        expect(actual.detectionLevel).toEqual(0)
    });

    it('handles armor hearing modifiers', function () {
        const handler = factories.skillHandlerFactory({
                            character: {cur_int: 50},
                            armor: {base: {mod_hear: -5}}});

        const actual = handler.hearingCheck();
        expect(actual.check.value()).toEqual(45)
        expect(actual.detectionLevel).toEqual(0)
    });

    it('handles skill hearing modifiers', function () {
        const handler = factories.skillHandlerFactory({character: {cur_int: 50},
        skills: [{skill: "Search", level: 1}]});

        const actual = handler.hearingCheck();
        expect(actual.check.value()).toEqual(55)
        expect(actual.detectionLevel).toEqual(0)
    });

    it('recognizes Acute Hearing for detection level', function () {
        const handler = factories.skillHandlerFactory({character: {cur_int: 50},
        edges: [{edge: "Acute Hearing", level: 1}]});

        const actual = handler.hearingCheck();
        expect(actual.check.value()).toEqual(50)
        expect(actual.detectionLevel).toEqual(1)
    });

    it('recognizes Poor Hearing for detection level', function () {
        const handler = factories.skillHandlerFactory({character: {cur_int: 50},
        edges: [{edge: "Poor Hearing", level: 1}]});

        const actual = handler.hearingCheck();
        expect(actual.check.value()).toEqual(50)
        expect(actual.detectionLevel).toEqual(-1)
    });

    it('recognizes Acute Touch for detection level', function () {
        const handler = factories.skillHandlerFactory({character: {cur_int: 50},
        edges: [{edge: "Acute Touch", level: 1}]});

        const actual = handler.touchCheck();
        expect(actual.check.value()).toEqual(50)
        expect(actual.detectionLevel).toEqual(1)
    });

    it('handles skill touch modifiers', function () {
        const handler = factories.skillHandlerFactory({character: {cur_int: 50},
        skills: [{skill: "Search", level: 1}]});

        const actual = handler.touchCheck();
        expect(actual.check.value()).toEqual(55)
        expect(actual.detectionLevel).toEqual(0)
    });

    it('handles armor touch modifiers', function () {
        const handler = factories.skillHandlerFactory({
                            character: {cur_int: 50},
                            armor: {base: {mod_climb: -5}}});
        // expect(handler.touchCheck()).toEqual({check: 47, detectionLevel: 0});
        const actual = handler.touchCheck();
        expect(actual.check.value()).toEqual(47)
        expect(actual.detectionLevel).toEqual(0)
    });

    it('allows checking against a distance', function (){
        const handler = factories.skillHandlerFactory({character: {cur_int: 50},
        edges: [{edge: "Night Vision", level: 1}]});

        expect(handler.visionCheck(90, 0).value()).toEqual(80);
        // night vision should cancel one level of darkness.
        expect(handler.visionCheck(90, -1).value()).toEqual(80);
        expect(handler.visionCheck(90, -2).value()).toEqual(60);

        //
        expect(handler.visionCheck(300, -3)).toBe(null);
        expect(handler.visionCheck(200, -3).value()).toEqual(30);

    });

    it('allows using weapon perks for night vision', function (){
        const handler = factories.skillHandlerFactory({character: {cur_int: 50}});
        const perks = [{edge: "Night Vision", level: 1}];

        expect(handler.visionCheck(90, 0, perks).value()).toEqual(80);
        // night vision should cancel one level of darkness.
        expect(handler.visionCheck(90, -1, perks).value()).toEqual(80);
        expect(handler.visionCheck(90, -2, perks).value()).toEqual(60);

        //
        expect(handler.visionCheck(300, -3, perks)).toBe(null);
        expect(handler.visionCheck(200, -3, perks).value()).toEqual(30);

    });

    it('allows checking against a distance with both night and ' +
        'acute vision', function () {
        const handler = factories.skillHandlerFactory({
            character: {cur_int: 50},
            edges: [{edge: "Night Vision", level: 1},
                {edge: "Acute Vision", level: 2}]
        });
        // Acute vision has full effect in daylight.
        expect(handler.visionCheck(90, 0).value()).toEqual(100);
        // Acute vision has half effect in dark conditions.
        expect(handler.visionCheck(90, -1).value()).toEqual(90);
        expect(handler.visionCheck(510, -3)).toBe(null);
        expect(handler.visionCheck(300, -3).value()).toEqual(30);
        expect(handler.visionCheck(200, -3).value()).toEqual(40);
    });

    it('allows using weapon perks for both night vision and acute vision', function (){
        const handler = factories.skillHandlerFactory({character: {cur_int: 50}});
        const perks = [{edge: "Night Vision", level: 1},
        {edge: "Acute Vision", level: 2}];

        expect(handler.visionCheck(90, -1, perks).value()).toEqual(90);
        expect(handler.visionCheck(510, -3, perks)).toBe(null);
        expect(handler.visionCheck(300, -3, perks).value()).toEqual(30);
        expect(handler.visionCheck(200, -3, perks).value()).toEqual(40);
    });
});