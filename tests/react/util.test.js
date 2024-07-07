import * as sheet_util from 'sheet-util'
import {getCounteredPenalty} from "sheet-util";

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

describe('getCounteredPenalty', function () {
    it("correctly counters penalties", function () {
        expect(getCounteredPenalty(1, 2)).toEqual(0)
        expect(getCounteredPenalty(-1, 2)).toEqual(1)
        expect(getCounteredPenalty(-2, 1)).toEqual(1)
        expect(getCounteredPenalty(-1, -2)).toEqual(-2)
        expect(getCounteredPenalty(3, -2)).toEqual(-2)
        expect(getCounteredPenalty(-1, -2)).toEqual(-2)
    })
})