import factories from './factories';

describe('SkillHandler edge skill bonuses', function() {
    it('handles plain surprise check', function () {
        const handler = factories.skillHandlerFactory({character: {cur_psy: 50}});

        expect(handler.surpriseCheck()).toEqual(50);
    });

    it('recognizes Night Vision for detection level', function () {
        const handler = factories.skillHandlerFactory({character: {cur_int: 50},
        edges: [{edge: "Night Vision", level: 1}]});

        expect(handler.nightVisionBaseCheck()).toEqual({check: 50,
            darknessDetectionLevel: 1, detectionLevel: 0});
    });

    it('recognizes Night Blindness for detection level', function () {
        const handler = factories.skillHandlerFactory({character: {cur_int: 50},
        edges: [{edge: "Night Blindness", level: 1}]});

        expect(handler.nightVisionBaseCheck()).toEqual({check: 50,
            darknessDetectionLevel: -1, detectionLevel: 0});
    });

    it('handles skill night vision modifiers', function () {
        const handler = factories.skillHandlerFactory({
                            character: {cur_int: 50},
                            skills: [{skill: "Search", level: 1}]});
        expect(handler.nightVisionBaseCheck()).toEqual({check: 55,
            darknessDetectionLevel: 0, detectionLevel: 0});
    });

    it('recognizes Acute Vision for detection level', function () {
        const handler = factories.skillHandlerFactory({character: {cur_int: 50},
        edges: [{edge: "Acute Vision", level: 3}]});

        expect(handler.nightVisionBaseCheck()).toEqual({check: 50, detectionLevel: 1,
                    darknessDetectionLevel: 0});
    });

    it('correctly rounds Acute Vision down for detection level', function () {
        const handler = factories.skillHandlerFactory({character: {cur_int: 50},
        edges: [{edge: "Acute Vision", level: 1}]});

        expect(handler.nightVisionBaseCheck()).toEqual({check: 50, detectionLevel: 0,
                    darknessDetectionLevel: 0});
    });

    it('handles Acute Vision and Night Vision in detection level', function () {
        const handler = factories.skillHandlerFactory({character: {cur_int: 50},
        edges: [{edge: "Acute Vision", level: 2}, {edge: "Night Vision", level: 1}]});

        expect(handler.nightVisionBaseCheck()).toEqual({check: 50, detectionLevel: 1,
                    darknessDetectionLevel: 1});
    });

    it('adds Poor Vision and Night Vision for detection level', function () {
        const handler = factories.skillHandlerFactory({character: {cur_int: 50},
        edges: [{edge: "Poor Vision", level: 2}, {edge: "Night Vision", level: 1}]});

        expect(handler.nightVisionBaseCheck()).toEqual({check: 50, detectionLevel: -1,
                    darknessDetectionLevel: 1});
    });

    it('recognizes Acute Vision for detection level', function () {
        const handler = factories.skillHandlerFactory({character: {cur_int: 50},
        edges: [{edge: "Acute Vision", level: 1}]});

        expect(handler.dayVisionBaseCheck()).toEqual({check: 50, detectionLevel: 1});
    });

    it('handles Color Blind', function () {
        const handler = factories.skillHandlerFactory({character: {cur_int: 50},
        edges: [{edge: "Color Blind", level: 1}]});

        expect(handler.dayVisionBaseCheck()).toEqual({check: 45, detectionLevel: 0});
    });

    it('recognizes Poor Vision for detection level', function () {
        const handler = factories.skillHandlerFactory({character: {cur_int: 50},
        edges: [{edge: "Poor Vision", level: 1}]});

        expect(handler.dayVisionBaseCheck()).toEqual({check: 50, detectionLevel: -1});
    });

    it('handles edge vision modifiers', function () {
        const handler = factories.skillHandlerFactory({character: {cur_int: 50},
        edges: [{edge: "Peripheral Vision", level: 1, vision: 5}]});

        expect(handler.dayVisionBaseCheck()).toEqual({check: 55, detectionLevel: 0});
    });

    it('handles armor vision modifiers', function () {
        const handler = factories.skillHandlerFactory({
                            character: {cur_int: 50},
                            armor: {base: {mod_vision: -5}}});
        expect(handler.dayVisionBaseCheck()).toEqual({check: 45, detectionLevel: 0});
    });

    it('handles skill day vision modifiers', function () {
        const handler = factories.skillHandlerFactory({
                            character: {cur_int: 50},
                            skills: [{skill: "Search", level: 1}]});
        expect(handler.dayVisionBaseCheck()).toEqual({check: 55, detectionLevel: 0});
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

        expect(handler.smellCheck()).toEqual({check: 55, detectionLevel: 0});
    });

    it('handles armor smell modifiers', function () {
        const handler = factories.skillHandlerFactory({
                            character: {cur_int: 50},
                            armor: {base: {mod_smell: -5}}});
        expect(handler.smellCheck()).toEqual({check: 45, detectionLevel: 0});
    });

    it('handles skill smell modifiers', function () {
        const handler = factories.skillHandlerFactory({character: {cur_int: 50},
        skills: [{skill: "Search", level: 1}]});

        expect(handler.smellCheck()).toEqual({check: 55, detectionLevel: 0});
    });

    it('recognizes Acute Smell and Taste for detection level', function () {
        const handler = factories.skillHandlerFactory({character: {cur_int: 50},
        edges: [{edge: "Acute Smell and Taste", level: 1}]});

        expect(handler.smellCheck()).toEqual({check: 50, detectionLevel: 1});
    });

    it('recognizes Poor Smell and Taste for detection level', function () {
        const handler = factories.skillHandlerFactory({character: {cur_int: 50},
        edges: [{edge: "Poor Smell and Taste", level: 1}]});

        expect(handler.smellCheck()).toEqual({check: 50, detectionLevel: -1});
    });

    it('handles edge hearing modifiers', function () {
        const handler = factories.skillHandlerFactory({character: {cur_int: 50},
        edges: [{edge: "Apt Hunter", level: 1, hear: 5}]});

        expect(handler.hearingCheck()).toEqual({check: 55, detectionLevel: 0});
    });

    it('handles armor hearing modifiers', function () {
        const handler = factories.skillHandlerFactory({
                            character: {cur_int: 50},
                            armor: {base: {mod_hear: -5}}});
        expect(handler.hearingCheck()).toEqual({check: 45, detectionLevel: 0});
    });

    it('handles skill hearing modifiers', function () {
        const handler = factories.skillHandlerFactory({character: {cur_int: 50},
        skills: [{skill: "Search", level: 1}]});

        expect(handler.hearingCheck()).toEqual({check: 55, detectionLevel: 0});
    });

    it('recognizes Acute Hearing for detection level', function () {
        const handler = factories.skillHandlerFactory({character: {cur_int: 50},
        edges: [{edge: "Acute Hearing", level: 1}]});

        expect(handler.hearingCheck()).toEqual({check: 50, detectionLevel: 1});
    });

    it('recognizes Poor Hearing for detection level', function () {
        const handler = factories.skillHandlerFactory({character: {cur_int: 50},
        edges: [{edge: "Poor Hearing", level: 1}]});

        expect(handler.hearingCheck()).toEqual({check: 50, detectionLevel: -1});
    });

    it('recognizes Acute Touch for detection level', function () {
        const handler = factories.skillHandlerFactory({character: {cur_int: 50},
        edges: [{edge: "Acute Touch", level: 1}]});

        expect(handler.touchCheck()).toEqual({check: 50, detectionLevel: 1});
    });

    it('handles skill touch modifiers', function () {
        const handler = factories.skillHandlerFactory({character: {cur_int: 50},
        skills: [{skill: "Search", level: 1}]});

        expect(handler.touchCheck()).toEqual({check: 55, detectionLevel: 0});
    });

    it('handles armor touch modifiers', function () {
        const handler = factories.skillHandlerFactory({
                            character: {cur_int: 50},
                            armor: {base: {mod_climb: -5}}});
        expect(handler.touchCheck()).toEqual({check: 47, detectionLevel: 0});
    });

    it('allows checking against a distance', function (){
        const handler = factories.skillHandlerFactory({character: {cur_int: 50},
        edges: [{edge: "Night Vision", level: 1}]});

        expect(handler.nightVisionCheck(90, 0)).toEqual(80);
        // night vision should cancel one level of darkness.
        expect(handler.nightVisionCheck(90, -1)).toEqual(80);
        expect(handler.nightVisionCheck(90, -2)).toEqual(60);

        //
        expect(handler.nightVisionCheck(300, -3)).toBe(null);
        expect(handler.nightVisionCheck(200, -3)).toEqual(30);

    });

    it('allows using weapon perks for night vision', function (){
        const handler = factories.skillHandlerFactory({character: {cur_int: 50}});
        const perks = [{edge: "Night Vision", level: 1}];

        expect(handler.nightVisionCheck(90, 0, perks)).toEqual(80);
        // night vision should cancel one level of darkness.
        expect(handler.nightVisionCheck(90, -1, perks)).toEqual(80);
        expect(handler.nightVisionCheck(90, -2, perks)).toEqual(60);

        //
        expect(handler.nightVisionCheck(300, -3, perks)).toBe(null);
        expect(handler.nightVisionCheck(200, -3, perks)).toEqual(30);

    });

    it('allows checking against a distance with both night and ' +
        'acute vision', function () {
        const handler = factories.skillHandlerFactory({
            character: {cur_int: 50},
            edges: [{edge: "Night Vision", level: 1},
                {edge: "Acute Vision", level: 2}]
        });
        expect(handler.nightVisionCheck(90, -1)).toEqual(90);
        expect(handler.nightVisionCheck(510, -3)).toBe(null);
        expect(handler.nightVisionCheck(300, -3)).toEqual(30);
        expect(handler.nightVisionCheck(200, -3)).toEqual(40);
    });

    it('allows using weapon perks for both night vision and acute vision', function (){
        const handler = factories.skillHandlerFactory({character: {cur_int: 50}});
        const perks = [{edge: "Night Vision", level: 1},
        {edge: "Acute Vision", level: 2}];

        expect(handler.nightVisionCheck(90, -1, perks)).toEqual(90);
        expect(handler.nightVisionCheck(510, -3, perks)).toBe(null);
        expect(handler.nightVisionCheck(300, -3, perks)).toEqual(30);
        expect(handler.nightVisionCheck(200, -3, perks)).toEqual(40);
    });
});