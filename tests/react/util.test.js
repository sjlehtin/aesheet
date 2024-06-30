import * as sheet_util from 'sheet-util'

describe('isFloat', function() {
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
    it('recognizes valid input', function () {
        expect(sheet_util.isInt("2")).toBe(true);
        expect(sheet_util.isInt(1)).toBe(true);
    });

    it('recognizes invalid input', function () {
        expect(sheet_util.isInt("a2.06")).toBe(false);
    });
});