import FloatInputControl from "./FloatInputControl";
import React from "react";

export default function RangeControl({
  onChange,
  initialValue,
  ...extraProps
}) {
  return (
    <FloatInputControl
      label="Range"
      placeHolder={"Leave empty to shoot to short range"}
      onChange={onChange}
      isValid={(val) => val === "" || !isNaN(parseFloat(val))}
      initialValue={initialValue}
      defaultValue=""
    />
  );
}
