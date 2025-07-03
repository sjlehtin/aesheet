import FloatInputControl from "./FloatInputControl";

function GravityControl({ onChange, initialValue, ...extraProps } : { onChange: (val: string) => Promise<void>, initialValue: string}) {
  return (
    <FloatInputControl
      label="Gravity"
      placeHolder={"1.0"}
      onChange={onChange}
      initialValue={initialValue}
      defaultValue={1.0}
      {...extraProps}
    />
  );
}

export default GravityControl;
