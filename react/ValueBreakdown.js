export default class ValueBreakdown {
    #value = 0
    #breakdown = []

    constructor() {

    }

    add(newValue, description, forceAdd= false) {
        if (newValue || forceAdd) {
            this.#value += newValue
            this.#breakdown.push({value: newValue, reason: description})
        }
    }

    addBreakdown(breakdown) {
        this.#value += breakdown.value()
        this.#breakdown = Array.concat(this.#breakdown, breakdown.breakdown())
    }

    value() {
        return this.#value
    }

    breakdown() {
        return this.#breakdown
    }
}