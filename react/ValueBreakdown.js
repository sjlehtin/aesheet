import * as util from "./sheet-util";

export default class ValueBreakdown {
  #value = 0;
  #breakdown = [];

  #setValue = null;
  #maximum = null;
  #maxMessage = "Max value";
  #minimum = null;
  #minMessage = "Min value";

  constructor(initialValue, initialDescription) {
    if (initialValue !== undefined) {
      this.add(initialValue, initialDescription);
    }
  }

  add(newValue, description, forceAdd = false) {
    if (newValue || forceAdd) {
      this.#value += newValue;
      this.#breakdown.push({
        value: newValue,
        reason: description,
        operation: "+",
      });
    }
  }

  multiply(newValue, description, forceAdd) {
    if (newValue !== 1.0 || forceAdd) {
      this.#value *= newValue;
      this.#breakdown.push({
        value: newValue,
        operation: "*",
        reason: description,
      });
    }
  }

  divide(newValue, description, forceAdd) {
    if (newValue !== 1.0 || forceAdd) {
      this.#value /= newValue;
      this.#breakdown.push({
        value: newValue,
        operation: "/",
        reason: description,
      });
    }
  }

  set(valueToReturn, description) {
    this.#setValue = valueToReturn;
    this.#breakdown.push({ value: 0, reason: description });
  }

  addBreakdown(breakdown) {
    this.#value += breakdown.value();
    this.#breakdown = [...this.#breakdown, ...breakdown.breakdown()];
    // Inherit set value from the new bd unless already set here.
    if (this.#setValue === null) {
      this.#setValue = breakdown.#setValue;
    }
  }

  roundup() {
    const oldValue = this.#value;
    this.#value = util.roundup(this.#value);
    const diff = this.#value - oldValue;
    if (diff) {
      this.#breakdown.push({
        value: diff,
        operator: "U",
        reason: "round up",
      });
    }
  }

  rounddown() {
    const oldValue = this.#value;
    this.#value = util.rounddown(this.#value);
    const diff = this.#value - oldValue;
    if (diff) {
      this.#breakdown.push({
        value: diff,
        operator: "D",
        reason: "round down",
      });
    }
  }

  setMaximum(maxValue, message) {
    this.#maximum = maxValue;
    if (message) {
      this.#maxMessage = message;
    }
  }

  setMinimum(minValue, message) {
    this.#minimum = minValue;
    if (message) {
      this.#minMessage = message;
    }
  }

  value() {
    if (this.#setValue !== null) {
      return this.#setValue;
    }
    if (this.#maximum !== null) {
      if (this.#value > this.#maximum) {
        return this.#maximum;
      }
    }
    if (this.belowMinimum()) {
      return this.#minimum;
    }
    return this.#value;
  }

  aboveMaximum() {
    return this.#maximum !== null && this.#value > this.#maximum;
  }

  belowMinimum() {
    return this.#minimum !== null && this.#value < this.#minimum;
  }

  breakdown() {
    if (this.belowMinimum()) {
      return [
        ...this.#breakdown,
        {
          value: this.#minimum,
          operator: "MIN",
          reason: this.#minMessage,
        },
      ];
    }
    if (this.aboveMaximum()) {
      return [
        ...this.#breakdown,
        {
          value: this.#maximum,
          operator: "MAX",
          reason: this.#maxMessage,
        },
      ];
    }
    return this.#breakdown;
  }
}
