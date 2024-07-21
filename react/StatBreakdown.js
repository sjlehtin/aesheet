import React, { useRef, useState } from "react";
import { OverlayTrigger, Tooltip } from "react-bootstrap";

export default function StatBreakdown({
  value: givenValue,
  toFixed,
  breakdown: givenBreakdown = [],
  style = {},
  label = "Skill check",
  units = "",
}) {
  const [showOverlay, setShowOverlay] = useState(false);

  let rows = [];

  let calculatedToFixed = 2;
  let coerceMainValue = false;
  if (toFixed !== undefined) {
    coerceMainValue = true;
    calculatedToFixed = toFixed;
  }

  function renderValue(value) {
    if (coerceMainValue || !Number.isInteger(value)) {
      value = value.toFixed(calculatedToFixed);
    }
    return value;
  }

  let calculatedValue;
  let calculatedBreakdown = [];

  if (typeof givenValue === "number") {
    calculatedValue = givenValue;
    calculatedBreakdown = givenBreakdown ?? [];
  } else if (givenValue) {
    calculatedValue = givenValue.value();
    calculatedBreakdown = givenValue.breakdown();
  }

  calculatedBreakdown.forEach((row, index) => {
    // TODO: logic to ValueBreakdown
    let value = row.value;
    value = renderValue(value);
    rows.push(
      <tr key={index}>
        <td>{row.reason}</td>
        <td>
          {row.operation !== "+" ? (row.operation ?? "") : ""}
          {value}
        </td>
      </tr>,
    );
  });
  const containerRef = useRef();
  const targetRef = useRef();
  const calculatedLabel = label;
  return calculatedValue !== undefined ? (
    <div
      ref={containerRef}
      onClick={() => {
        setShowOverlay(!showOverlay);
      }}
      style={style}
      aria-label={calculatedLabel}
    >
      <OverlayTrigger
        show={showOverlay}
        onToggle={(shouldShow) => setShowOverlay(shouldShow)}
        delay={{ show: 200, hide: 400 }}
        placement={"auto"}
        container={containerRef}
        target={targetRef}
        overlay={(props) => (
          <Tooltip {...props}>
            <div>
              <table aria-label={`${calculatedLabel} breakdown`}>
                <thead>
                  <tr>
                    <th colSpan={2}>{`${calculatedLabel} breakdown`}</th>
                  </tr>
                </thead>
                <tbody>{rows}</tbody>
              </table>
            </div>
          </Tooltip>
        )}
      >
        <div ref={targetRef}>
          {renderValue(calculatedValue)}
          {units}
        </div>
      </OverlayTrigger>
    </div>
  ) : (
    ""
  );
}
