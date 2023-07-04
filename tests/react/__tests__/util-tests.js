jest.dontMock('sheet-util');

var sheet_util = require('sheet-util');


describe('isFloat', function() {
    "use strict";

    it('recognizes valid input', function () {
        expect(sheet_util.isFloat(2.06)).toBe(true);
        expect(sheet_util.isFloat("2.06")).toBe(true);
        expect(sheet_util.isFloat("2")).toBe(true);
    });

    it('recognizes invalid input', function () {
        expect(sheet_util.isFloat("a2.06")).toBe(false);
    });
});

describe('isInt', function() {
    "use strict";

    it('recognizes valid input', function () {
        expect(sheet_util.isInt("2")).toBe(true);
        expect(sheet_util.isInt(1)).toBe(true);
    });

    it('recognizes invalid input', function () {
        expect(sheet_util.isInt("a2.06")).toBe(false);
    });
});