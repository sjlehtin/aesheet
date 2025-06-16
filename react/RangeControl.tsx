import FloatInputControl from "./FloatInputControl";

export default function RangeControl({
  onChange,
  initialValue,
}: {
  onChange: (val: string) => Promise<void>;
  initialValue: string;
}) {
  return (
    <FloatInputControl
      label="Range"
      placeHolder={"Leave empty to shoot to short range"}
      onChange={onChange}
      initialValue={initialValue}
      defaultValue=""
    />
  );
}
