import ValueBreakdown from 'ValueBreakdown';

describe("ValueBreakdown", function () {
    it("allows adding values with reasons", function () {
        const bd = new ValueBreakdown()
        expect(bd.value()).toEqual(0)
        expect(bd.breakdown()).toEqual([])

        bd.add(4, "because")
        bd.add(-2.5, "penalty")

        expect(bd.value()).toEqual(1.5)
        expect(bd.breakdown()).toEqual([{value: 4, reason: "because"}, {value: -2.5, reason: "penalty"}])

        // If value does not change, reason is ignored by default.
        bd.add(0, "no reason")
        expect(bd.value()).toEqual(1.5)
        expect(bd.breakdown().length).toEqual(2)

        bd.add(0, "no reason", true)
        expect(bd.value()).toEqual(1.5)
        expect(bd.breakdown().length).toEqual(3)
        expect(bd.breakdown()[2]).toEqual({value: 0, reason: "no reason"})
    })
})