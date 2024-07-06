import ValueBreakdown from 'ValueBreakdown';

describe("ValueBreakdown", function () {
    it("allows adding values with reasons", function () {
        const bd = new ValueBreakdown()
        expect(bd.value()).toEqual(0)
        expect(bd.breakdown()).toEqual([])

        bd.add(4, "because")
        bd.add(-2.5, "penalty")

        expect(bd.value()).toEqual(1.5)
        expect(bd.breakdown()).toEqual([{value: 4, operation: '+', reason: "because"}, {value: -2.5, operation: '+', reason: "penalty"}])

        // If value does not change, reason is ignored by default.
        bd.add(0, "no reason")
        expect(bd.value()).toEqual(1.5)
        expect(bd.breakdown().length).toEqual(2)

        bd.add(0, "no reason", true)
        expect(bd.value()).toEqual(1.5)
        expect(bd.breakdown().length).toEqual(3)
        expect(bd.breakdown()[2]).toEqual({value: 0, operation: '+', reason: "no reason"})
    })

    it("can take in an existing breakdown", function () {
        const bd = new ValueBreakdown()
        bd.add(4, "because")
        bd.add(-2.5, "penalty")

        expect(bd.value()).toEqual(1.5)

        const bd2 = new ValueBreakdown()
        bd2.add(3, "initial")

        expect(bd2.value()).toEqual(3)
        bd2.addBreakdown(bd)
        expect(bd2.value()).toEqual(4.5)
        expect(bd2.breakdown().length).toEqual(3)
    })

    it ("can set a value to a disabled value", function () {
        const bd = new ValueBreakdown()
        bd.add(4, "because")
        bd.add(-2.5, "penalty")

        bd.set(-100, "Character disabled")

        expect(bd.value()).toEqual(-100)

        const bd2 = new ValueBreakdown()
        bd2.add(3, "initial")
        expect(bd2.value()).toEqual(3)

        bd2.addBreakdown(bd)
        expect(bd2.value()).toEqual(-100)
    })

    it ("can multiply values", function () {
        const bd = new ValueBreakdown()
        bd.add(4, "because")
        bd.multiply(5, "ace in the sleeve")

        expect(bd.value()).toEqual(20)
        expect(bd.breakdown().length).toEqual(2)

        bd.multiply(1.0, "nothing much")
        expect(bd.breakdown().length).toEqual(2)

        bd.multiply(1.0, "nothing much", true)
        expect(bd.breakdown().length).toEqual(3)
    })

    it ("can divide values", function () {
        const bd = new ValueBreakdown()
        bd.add(4, "because")
        bd.divide(2, "deuce in the sleeve")

        expect(bd.value()).toEqual(2)
        expect(bd.breakdown().length).toEqual(2)

        bd.divide(1.0, "nothing much")
        expect(bd.breakdown().length).toEqual(2)

        bd.divide(1.0, "nothing much", true)
        expect(bd.breakdown().length).toEqual(3)
    })
})