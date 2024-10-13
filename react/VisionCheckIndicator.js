import React from "react";
import { Badge } from "react-bootstrap";
import { GoAlert } from "react-icons/go";
import StatBreakdown from "./StatBreakdown";
import RangedWeaponModel from "./RangedWeaponModel";

export default function VisionCheckIndicator({
  skillHandler,
  range,
  detectionLevel,
  ...extraProps
}) {
  if (!skillHandler) {
    return "";
  }

  const bd = skillHandler.visionCheck(range, detectionLevel);
  if (!bd) {
    return (
      <div className={"p-1"}>
        <Badge bg="warning">
          <GoAlert size={"2em"} />
        </Badge>{" "}
        Unable to see this far!
      </div>
    );
  }

  const check = bd.value();
  let style = {};
  let verbose = "";
  if (check < RangedWeaponModel.VISION_CHECK_PENALTY_LIMIT) {
    style.color = "hotpink";
    verbose = `Ranged penalty: ${RangedWeaponModel.VISION_CHECK_PENALTY_LIMIT - check}`;
  } else if (check >= RangedWeaponModel.VISION_BUMPING_LIMIT) {
    style.fontWeight = "bold";
    verbose = "Bumping enabled";
  }

  return (
    <div {...extraProps}>
      <span>Vision check:</span>
      <span style={style}>
        <StatBreakdown value={bd} label="Vision check" />
      </span>
      <span
        className={"ml-2"}
        style={{ fontStyle: "italic" }}
        aria-label={"Vision check detail"}
      >
        {verbose}
      </span>
    </div>
  );
}
