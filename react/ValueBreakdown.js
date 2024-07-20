import * as util from "./sheet-util";

export default class ValueBreakdown {
    #value = 0
    #breakdown = []

    #setValue = null

    constructor(initialValue, initialDescription) {
        if (initialValue !== undefined) {
            this.add(initialValue, initialDescription)
        }
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

    multiply(newValue, description, forceAdd) {
        if (newValue !== 1.0 || forceAdd) {
            this.#value *= newValue
            this.#breakdown.push({
                value: newValue,
                operation: "*",
                reason: description
            })
        }
    }

    divide(newValue, description, forceAdd) {
        if (newValue !== 1.0 || forceAdd) {
            this.#value /= newValue
            this.#breakdown.push({
                value: newValue, operation: "/",
                reason: description
            })
        }
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

    roundup() {
        const oldValue = this.#value
        this.#value = util.roundup(this.#value)
        this.#breakdown.push({value: this.#value - oldValue, operator: "U", reason: "roundup"})
    }

    rounddown() {
        const oldValue = this.#value
        this.#value = util.rounddown(this.#value)
        this.#breakdown.push({value: this.#value - oldValue, operator: "D", reason: "rounddown"})
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