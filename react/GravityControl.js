import React, { useState } from "react";
import { FloatingLabel, Form } from "react-bootstrap";
import PropTypes from "prop-types";
import { isFloat } from "./sheet-util";

function GravityControl({ onChange, initialValue, extraProps }) {
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
      <FloatingLabel controlId="gravity-input" label="Gravity" className="mb-3">
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
          placeholder={"1.0"}
          {...extraProps}
        />
      </FloatingLabel>
    </>
  );
}

GravityControl.propTypes = { onChange: PropTypes.func };

export default GravityControl;
