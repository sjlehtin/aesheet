import * as util from "./sheet-util";

interface BreakdownItem {
  value: number;
  reason: string;
  operation: string;
}

export default class ValueBreakdown {
  #value = 0;
  #breakdown: BreakdownItem[] = [];

  #setValue: number | null = null;
  #maximum: number | null = null;
  #maxMessage = "Max value";
  #minimum: number | null = null;
  #minMessage = "Min value";

  constructor(initialValue?: number, initialDescription?: string) {
    if (initialValue !== undefined) {
      this.add(initialValue, initialDescription ?? "");
    }
  }

  add(newValue: number, description: string, forceAdd = false) {
    if (newValue || forceAdd) {
      this.#value += newValue;
      this.#breakdown.push({
        value: newValue,
        reason: description,
        operation: "+",
      });
    }
  }

  multiply(newValue: number, description: string, forceAdd = false) {
    if (newValue !== 1.0 || forceAdd) {
      this.#value *= newValue;
      this.#breakdown.push({
        value: newValue,
        operation: "*",
        reason: description,
      });
    }
  }

  divide(newValue: number, description: string, forceAdd = false) {
    if (newValue !== 1.0 || forceAdd) {
      this.#value /= newValue;
      this.#breakdown.push({
        value: newValue,
        operation: "/",
        reason: description,
      });
    }
  }

  set(valueToReturn: number, description: string) {
    this.#setValue = valueToReturn;
    this.#breakdown.push({ value: 0, operation: "=", reason: description });
  }

  addBreakdown(breakdown: ValueBreakdown|null) {
    if (breakdown !== null) {
      this.#value += breakdown.value();
      this.#breakdown = [...this.#breakdown, ...breakdown.breakdown()];
      // Inherit set value from the new bd unless already set here.
      if (this.#setValue === null) {
        this.#setValue = breakdown.#setValue;
      }
    } else {
      this.set(0, "Passed null breakdown");
    }
  }

  roundup() {
    const oldValue = this.#value;
    this.#value = util.roundup(this.#value);
    const diff = this.#value - oldValue;
    if (diff) {
      this.#breakdown.push({
        value: diff,
        operation: "U",
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
        operation: "D",
        reason: "round down",
      });
    }
  }

  setMaximum(maxValue: number, message: string) {
    this.#maximum = maxValue;
    if (message) {
      this.#maxMessage = message;
    }
  }

  setMinimum(minValue: number, message: string) {
    this.#minimum = minValue;
    if (message) {
      this.#minMessage = message;
    }
  }

  value(): number {
    if (this.#setValue !== null) {
      return this.#setValue;
    }
    if (this.#maximum !== null) {
      if (this.#value > this.#maximum) {
        return this.#maximum;
      }
    }
    if (this.belowMinimum()) {
      return this.#minimum as number;
    }
    return this.#value;
  }

  aboveMaximum() {
    return this.#maximum !== null && this.#value > this.#maximum;
  }

  belowMinimum() {
    return this.#minimum !== null && this.#value < this.#minimum;
  }

  breakdown(): BreakdownItem[] {
    if (this.belowMinimum()) {
      return [
        ...this.#breakdown,
        {
          value: this.#minimum as number,
          operation: "MIN",
          reason: this.#minMessage,
        },
      ];
    }
    if (this.aboveMaximum()) {
      return [
        ...this.#breakdown,
        {
          value: this.#maximum as number,
          operation: "MAX",
          reason: this.#maxMessage,
        },
      ];
    }
    return this.#breakdown;
  }
}
