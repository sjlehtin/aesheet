import React, { useState } from "react";
import { FloatingLabel, Form } from "react-bootstrap";
import { isFloat } from "./sheet-util";

export default function FloatInputControl({ label, placeHolder, onChange, initialValue, ...extraProps }) {
  if (isFloat(initialValue)) {
    if (Number.isInteger(initialValue)) {
      initialValue = initialValue.toFixed(1);
    } else {
      initialValue = initialValue.toString();
    }
  }
  const [value, setValue] = useState(initialValue ? initialValue : "");
  const [isValid, setIsValid] = useState(true);

  return (
    <>
      <FloatingLabel controlId={`${label.toLowerCase()}-input`} label={label} className="mb-3">
        <Form.Control
          onChange={(e) => {
            let isValid, floatValue;
            if (e.target.value === "") {
              isValid = true;
              floatValue = 1.0;
            } else {
              isValid = isFloat(e.target.value);
              floatValue = parseFloat(e.target.value);
            }
            setIsValid(isValid);
            if (isValid) {
              onChange(floatValue);
            }
            setValue(e.target.value);
          }}
          isValid={isValid}
          value={value}
          type={"text"}
          placeholder={placeHolder}
          {...extraProps}
        />
      </FloatingLabel>
    </>
  );
}