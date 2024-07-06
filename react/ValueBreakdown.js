export default class ValueBreakdown {
    #value = 0
    #breakdown = []

    #setValue = null

    constructor() {

    }

    add(newValue, description, forceAdd= false) {
        if (newValue || forceAdd) {
            this.#value += newValue
            this.#breakdown.push({
                value: newValue,
                reason: description,
                operation: '+'
            })
        }
    }

    multiply(newValue, description) {
        this.#value *= newValue
        this.#breakdown.push({
            value: newValue,
            operation: "*",
            reason: description
        })
    }

    divide(newValue, description) {
        this.#value /= newValue
        this.#breakdown.push({value: newValue, operation: "/",
        reason: description})
    }

    set(valueToReturn, description) {
        this.#setValue = valueToReturn
        this.#breakdown.push({value: 0, reason: description})
    }

    addBreakdown(breakdown) {
        this.#value += breakdown.value()
        this.#breakdown = [...this.#breakdown, ...breakdown.breakdown()]
        // Inherit set value from the new bd unless already set here.
        if (this.#setValue === null) {
            this.#setValue = breakdown.#setValue
        }
    }

    value() {
        if (this.#setValue !== null) {
            return this.#setValue
        }
        return this.#value
    }

    breakdown() {
        return this.#breakdown
    }
}