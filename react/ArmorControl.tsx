import { CSSProperties, useState } from "react";
import { Button, Col, Row } from "react-bootstrap";

import AddArmorControl from "./AddArmorControl";
import StatBreakdown from "./StatBreakdown";
import ValueBreakdown from "./ValueBreakdown";

import * as util from "./sheet-util";
import {
  Armor,
  ArmorLocation,
  ArmorQuality,
  ArmorStatType,
  ArmorTemplate,
  SheetMiscellaneousItem,
} from "./api";

interface SkillHandler {
  getEdgeModifier(edgeType: string): number;

  getSkillLevel?(skillName: string): number;

  hasEdge?(edgeName: string): boolean;

  getArmorStatMod(stat: string): number;

  getDamageThreshold(location: ArmorLocation): number;

  getWoundPenalties(): {
    locationsDamages: { [loc: string]: number };
    bodyDamage: number;
  };
}

function getArmorStat(
  location: ArmorLocation,
  type: ArmorStatType,
  piece: ArmorPiece,
) {
  const getBaseValue = function (
    a: ArmorTemplate,
    loc: ArmorLocation,
    typ: ArmorStatType,
  ) {
    return parseFloat(a[`armor_${loc}_${typ}`] ?? 0);
  };

  const getQualityValue = function (a: ArmorQuality, typ: ArmorStatType) {
    if (typ === "dp" || typ === "pl") {
      return 0;
    }
    return parseFloat(a[`armor_${typ}`] ?? 0);
  };

  const base = piece?.base ?? {};
  const quality = piece?.quality;

  const fromBase = getBaseValue(base, location, type);
  const fromQuality = quality ? getQualityValue(quality, type) : 0;

  /* Armor damage reduction is handled specially.
   *
   * If DR for quality is zero and the base armor affects location, DR
   * is calculated from the lethality reductions of the base with the
   * quality effect baked in.
   *
   * Excel formula:
   * =-ROUNDUP(POWER(2/3*AVERAGE(<over leth reduction types>);2);0)
   * => -9 overall leth reduction results in 36 DR
   */
  let fromArmor: number = 0;
  for (let col of ["p", "s", "b", "r"] as ArmorStatType[]) {
    fromArmor += getBaseValue(base, location, col);
  }

  // If there are no lethality reductions from base, the armor does not
  // affect this location, and we do not add the quality values to the
  // location.
  if (fromArmor === 0) {
    return fromBase;
  }

  let stat;
  if (type === "dp") {
    const dpMultiplier = parseFloat(quality?.dp_multiplier ?? "1.0");
    stat = fromBase * (dpMultiplier === 0 ? 1.0 : dpMultiplier);
  } else {
    stat = fromBase + fromQuality;
  }

  if (type === "dr" && quality && fromQuality === 0) {
    let fromQuality = 0;
    for (let col of ["p", "s", "b", "r"] as ArmorStatType[]) {
      fromQuality += getQualityValue(quality, col);
    }

    // Armor is calculated from the lethalities if quality has an effect.
    if (fromQuality !== 0) {
      const lethRed = fromArmor + fromQuality;
      stat = util.roundup(-Math.pow((lethRed / 4) * (2 / 3), 2));
    }
  }
  return stat;
}

interface ArmorLocationStats {
  p: ValueBreakdown;
  s: ValueBreakdown;
  b: ValueBreakdown;
  r: ValueBreakdown;
  dr: ValueBreakdown;
  dp: ValueBreakdown;
  pl: ValueBreakdown;
}

interface ArmorStats {
  h: ArmorLocationStats;
  ra: ArmorLocationStats;
  la: ArmorLocationStats;
  rl: ArmorLocationStats;
  ll: ArmorLocationStats;
  t: ArmorLocationStats;
}

interface ArmorPiece {
  name: string;
  base: ArmorTemplate;
  quality?: ArmorQuality;
}

function calculateArmorStats(
  armor: Armor,
  helm: Armor,
  miscItems: SheetMiscellaneousItem[],
  handler: SkillHandler,
) {
  let stats = {} as Partial<ArmorStats>;

  const armorPieces: ArmorPiece[] = [armor, helm];

  for (let item of miscItems) {
    for (let ql of item.item.armor_qualities) {
      armorPieces.push({
        name: item.item.name,
        base: ql as ArmorTemplate,
      });
    }
  }

  const fromEdgeLethalityReduction: number =
    handler?.getEdgeModifier("armor_l") ?? 0;
  const fromEdgeDamageReduction: number =
    handler?.getEdgeModifier("armor_dr") ?? 0;

  for (let loc of ["h", "t", "ra", "la", "rl", "ll"] as ArmorLocation[]) {
    let locStats = {} as Partial<ArmorLocationStats>;
    for (let col of ["p", "s", "b", "r", "dr", "dp", "pl"] as ArmorStatType[]) {
      const bd = new ValueBreakdown();

      if (col === "dr") {
        if (fromEdgeDamageReduction !== 0) {
          bd.add(fromEdgeDamageReduction, "from edges");
        }
      } else if (["p", "s", "b", "r"].includes(col)) {
        if (fromEdgeLethalityReduction !== 0) {
          bd.add(fromEdgeLethalityReduction, "from edges");
        }
      }

      for (const piece of armorPieces) {
        const eff = getArmorStat(loc, col, piece);
        if (eff) {
          bd.add(eff, piece.name ?? piece.base.name);
        }
      }
      locStats[col] = bd;
    }
    stats[loc] = locStats as ArmorLocationStats;
  }

  return stats as ArmorStats;
}

// The overall damage reduction is the (weighted) average damage reduction times two.
function getOverallDamageReduction(armorStats: ArmorStats) {
  let dr = 0;
  for (let loc of ["h", "ra", "la", "rl", "ll"] as ArmorLocation[]) {
    dr += armorStats[loc].dr.value();
  }
  dr += armorStats.t.dr.value() * 3;
  return util.rounddown((dr / 8) * 2);
}

export function ArmorControl({
  helm = { name: "None" } as Armor,
  armor = { name: "None" } as Armor,
  campaign,
  handler,
  miscellaneousItems = [],
  onHelmChange = () => Promise.resolve(),
  onArmorChange = () => Promise.resolve(),
  style = {} as CSSProperties,
}: {
  helm: Armor;
  armor: Armor;
  campaign: number;
  handler: SkillHandler;
  miscellaneousItems: SheetMiscellaneousItem[];
  onHelmChange: (armor: Armor | null) => Promise<void>;
  onArmorChange: (armor: Armor | null) => Promise<void>;
  style: CSSProperties;
}) {
  const [editing, setEditing] = useState(false);

  const addControls = editing ? (
    <Row>
      <Button
        onClick={() => onHelmChange(null)}
        disabled={!(helm ? helm.id : 0)}
      >
        Remove helmet
      </Button>
      <Button
        onClick={() => onArmorChange(null)}
        disabled={!(armor ? armor.id : 0)}
      >
        Remove armor
      </Button>

      <AddArmorControl
        tag="Helmet"
        current={helm}
        onChange={(value: Armor) => onHelmChange(value)}
        campaign={campaign}
      />
      <AddArmorControl
        current={armor}
        onChange={(value: Armor) => onArmorChange(value)}
        campaign={campaign}
      />
    </Row>
  ) : (
    <span />
  );

  const armorStats = calculateArmorStats(
    armor,
    helm,
    miscellaneousItems,
    handler,
  );

  const headerStyle: CSSProperties = {
    textAlign: "center",
    minWidth: "2.5em",
  };
  const cellStyle: CSSProperties = {
    minWidth: "2.5em",
    textAlign: "center",
    border: "1px dotted black",
  };
  const descStyle = Object.assign({ fontWeight: "bold" }, cellStyle);

  const headerCells = ["d8", "Loc", "P", "S", "B", "R", "DR", "DP", "PL"].map(
    (el, ii) => {
      return (
        <th style={headerStyle} key={ii}>
          {el}
        </th>
      );
    },
  );
  headerCells.push(
    <th
      title="Location damage threshold"
      style={headerStyle}
      key={headerCells.length}
    >
      Max
    </th>,
  );

  const woundPenalties = handler?.getWoundPenalties() ?? {};
  const damages = woundPenalties.locationsDamages;
  if (woundPenalties.bodyDamage) {
    headerCells.push(
      <th title="Current damage" style={headerStyle} key={headerCells.length}>
        Dmg
      </th>,
    );
  }
  let locations = [];
  const dice = { h: "8", t: "5-7", ra: "4", rl: "3", la: "2", ll: "1" };
  for (let loc of ["h", "t", "ra", "rl", "la", "ll"] as ArmorLocation[]) {
    let row = [];
    row.push(
      <td style={descStyle} key={loc + "-1"}>
        {dice[loc]}
      </td>,
    );
    row.push(
      <td style={descStyle} key={loc + "-2"}>
        {loc.toUpperCase()}
      </td>,
    );
    for (let col of ["p", "s", "b", "r", "dr", "dp", "pl"] as ArmorStatType[]) {
      const bd = new ValueBreakdown();
      bd.addBreakdown(armorStats[loc][col]);
      bd.rounddown();
      row.push(
        <td style={cellStyle} key={loc + "-" + col}>
          <StatBreakdown
            label={`Armor ${loc.toUpperCase()} ${col.toUpperCase()}`}
            value={bd}
          />
        </td>,
      );
    }

    const threshold = handler?.getDamageThreshold(loc);
    row.push(
      <td
        style={{ fontWeight: "bold", textAlign: "center" }}
        key={loc + "Threshold"}
      >
        {threshold}
      </td>,
    );
    const damage = damages ? damages[loc] : 0;
    const greenLimit = util.rounddown(threshold * 0.4);
    const yellowLimit = util.rounddown(threshold * 0.8);
    let damageColor;
    if (damage === 0) {
      damageColor = "transparent";
    } else if (damage < greenLimit) {
      damageColor = "green";
    } else if (damage < yellowLimit) {
      damageColor = "yellow";
    } else {
      damageColor = "red";
    }

    if (woundPenalties.bodyDamage) {
      row.push(
        <td
          style={{
            fontWeight: "bold",
            textAlign: "center",
            background: damageColor,
          }}
          key={loc + "Damage"}
        >
          {damages ? damages[loc] : ""}
        </td>,
      );
    }
    locations.push(<tr key={loc}>{row}</tr>);
  }

  const overallDamageReduction = getOverallDamageReduction(armorStats);
  locations.push(
    <tr key="Overall DR">
      <td colSpan={6}>
        <em>Overall damage reduction</em>
      </td>
      <td aria-label="Overall damage reduction" style={{ textAlign: "center" }}>
        {overallDamageReduction}
      </td>
    </tr>,
  );
  let editButtonName = "Edit Armor";
  if (editing) {
    editButtonName = "Close edit";
  }

  const editAvailable = !!onArmorChange;

  return (
    <div style={style}>
      <Row>
        <Col>
          <Row>
            <Col>Helmet</Col>
            <Col>
              <span aria-label={"Current helmet"}>{helm?.name}</span>
            </Col>
          </Row>
          <Row>
            <Col>Armor</Col>
            <Col aria-label={"Current armor"}>{armor?.name}</Col>
          </Row>
        </Col>
        {editAvailable ? (
          <Col>
            <Button onClick={() => setEditing(!editing)}>
              {editButtonName}
            </Button>
          </Col>
        ) : (
          ""
        )}
      </Row>
      {addControls}
      <Row>
        <Col>
          <table>
            <thead style={headerStyle} key={"thead"}>
              <tr>{headerCells}</tr>
            </thead>
            <tbody key={0}>{locations}</tbody>
          </table>
        </Col>
        <Col>
          <table>
            <thead>
              <tr>
                <th>Mod</th>
                <th>value</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["fit", "FIT"],
                ["ref", "REF"],
                ["surprise", "Surprise"],
                ["climb", "Climb"],
                ["stealth", "Stealth"],
                ["conceal", "Conceal"],
                ["suspendedWeight", "Suspension"],
              ].map(([val, descr]) => {
                return (
                  <tr key={`mod-${val}`}>
                    <td>{descr}</td>
                    <td style={{ paddingLeft: "1em" }}>
                      <StatBreakdown
                        value={handler.getArmorStatMod(val)}
                        label={`Stat mod for ${val}`}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Col>
      </Row>
    </div>
  );
}

export default ArmorControl;
