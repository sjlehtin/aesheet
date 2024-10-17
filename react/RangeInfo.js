import { Table } from "react-bootstrap";
import * as util from "./sheet-util";
import StatBreakdown from "./StatBreakdown";
import React from "react";

export function RangeInfo({ rangeEffect }) {
  if (rangeEffect) {
    let bumping;
    if (rangeEffect.bumpingAllowed && rangeEffect.bumpingLevel > 0) {
      bumping = `yes (${rangeEffect.bumpingLevel})`;
    } else {
      bumping = `no`;
    }
    return (
      <div>
        <Table>
          <tbody>
            <tr aria-label={"Range effect"}>
              <th>Range effect</th>
              <td
                className={"mx-2"}
                aria-label="Name"
              >{`${rangeEffect.name}`}</td>
              <th className={"ml-5"}>Bumping</th>
              <td className={"mx-2"} aria-label="Bumping allowed">
                {bumping}
              </td>
              <th className={"ml-5"}>Check</th>
              <td
                className={"mx-2"}
                aria-label="Check modifier"
              >{`${util.renderInt(rangeEffect.check)}`}</td>
              <th className={"ml-2"}>TI</th>
              <td
                className={"mx-2"}
                aria-label="Target initiative modifier"
              >{`${util.renderInt(rangeEffect.targetInitiative)}`}</td>
              <th className={"ml-5"}>Dmg</th>
              <td
                className={"mx-2"}
                aria-label="Damage modifier"
              >{`${util.renderInt(rangeEffect.damage)}`}</td>
              <th className={"ml-5"}>Leth</th>
              <td
                className={"mx-2"}
                aria-label="Lethality modifier"
              >{`${util.renderInt(rangeEffect.leth)}`}</td>
              <th className={"ml-5"}>Vision</th>
              <td className={"mx-2"}>
                <StatBreakdown
                  value={rangeEffect.visionCheck}
                  label={"Vision check"}
                />
              </td>
            </tr>
          </tbody>
        </Table>
      </div>
    );
  } else {
    return (
      <div>
        <span style={{ fontWeight: "bold" }}>
          Unable to shoot to this range
        </span>
      </div>
    );
  }
}
