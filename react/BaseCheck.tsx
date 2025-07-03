import StatBreakdown from "./StatBreakdown";
import ValueBreakdown from "./ValueBreakdown";

export function BaseCheck({ baseCheck }: { baseCheck: ValueBreakdown }) {
  const baseCheckStyle = {
    display: "inline-block",
    fontSize: "80%",
    marginLeft: "2em",
    color: "gray",
  };
  return (
    <div>
      <label id={"base-check"} style={baseCheckStyle}>
        Base check
      </label>
      <span aria-labelledby={"base-check"}>
        <StatBreakdown value={baseCheck} style={baseCheckStyle} toFixed={0} />
      </span>
    </div>
  );
}
