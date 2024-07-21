import React from "react";
import FloatInputControl from "./FloatInputControl";

function GravityControl({ onChange, initialValue, ...extraProps }) {
  return (
    <FloatInputControl
      label="Gravity"
      placeHolder={"1.0"}
      onChange={onChange}
      initialValue={initialValue}
      {...extraProps}
    />
  );
}

export default GravityControl;
