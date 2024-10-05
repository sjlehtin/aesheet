import React from "react";
import PropTypes from "prop-types";
import { Button, Col, Row } from "react-bootstrap";

import AddArmorControl from "./AddArmorControl";
import StatBreakdown from "./StatBreakdown";
import ValueBreakdown from "./ValueBreakdown";

import * as util from "./sheet-util";

function getArmorStat(location, type, piece) {
  const getBaseValue = function (a, loc, typ) {
    const val = a[`armor_${loc.toLowerCase()}_${typ.toLowerCase()}`];
    if (val) {
      return parseFloat(val);
    }
    return 0;
  };

  const getQualityValue = function (a, typ) {
    const val = a[`armor_${typ.toLowerCase()}`];
    if (val) {
      return parseFloat(val);
    }
    return 0;
  };

  const base = piece?.base ?? {};
  const quality = piece?.quality ?? {};

  const fromBase = getBaseValue(base, location, type);
  const fromQuality = getQualityValue(quality, type);

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
  let fromArmor = 0;
  for (let col of ["P", "S", "B", "R"]) {
    fromArmor += getBaseValue(base, location, col);
  }

  // If there are no lethality reductions from base, the armor does not
  // affect this location, and we do not add the quality values to the
  // location.
  if (fromArmor === 0) {
    return fromBase;
  }

  let stat;
  if (type === "DP") {
    const dpMultiplier = quality.dp_multiplier ?? 1.0;
    stat = fromBase * (dpMultiplier === 0 ? 1.0 : dpMultiplier);
  } else {
    stat = fromBase + fromQuality;
  }

  if (type === "DR" && piece?.quality && fromQuality === 0) {
    let fromQuality = 0;
    for (let col of ["P", "S", "B", "R"]) {
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

function calculateArmorStats(armor, helm, miscItems, handler) {
  let stats = {};

  let armorPieces = [armor, helm];

  for (let item of miscItems) {
    for (let ql of item.item.armor_qualities) {
      armorPieces.append({ name: item.item.name, base: ql });
    }
  }

  const fromEdgeLethalityReduction = handler?.getEdgeModifier("armor_l") ?? 0;
  const fromEdgeDamageReduction = handler?.getEdgeModifier("armor_dr") ?? 0;

  for (let loc of ["H", "T", "RA", "RL", "LA", "LL"]) {
    stats[loc] = {};
    for (let col of ["P", "S", "B", "R", "DR", "DP", "PL"]) {
      const bd = new ValueBreakdown();

      if (col === "DR") {
        if (fromEdgeDamageReduction !== 0) {
          bd.add(fromEdgeDamageReduction, "from edges");
        }
      } else if (["P", "S", "B", "R"].includes(col)) {
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
      stats[loc][col] = bd;
    }
  }

  return stats;
}

// The overall damage reduction is the (weighted) average damage reduction times two.
function getOverallDamageReduction(armorStats) {
  let dr = 0;
  for (let loc of ["H", "RA", "LA", "RL", "LL"]) {
    dr += armorStats[loc]["DR"].value();
  }
  dr += armorStats["T"]["DR"].value() * 3;
  return util.rounddown((dr / 8) * 2);
}

class ArmorControl extends React.Component {
  constructor(props) {
    super(props);
    this.state = { editing: false };
  }

  render() {
    let addControls = "";
    if (this.state.editing) {
      addControls = (
        <Row>
          <Button
            onClick={() => {
              this.props.onHelmChange(null);
            }}
            disabled={!(this.props.helm ? this.props.helm.id : 0)}
          >
            Remove helmet
          </Button>
          <Button
            onClick={() => this.props.onArmorChange(null)}
            disabled={!(this.props.armor ? this.props.armor.id : 0)}
          >
            Remove armor
          </Button>

          <AddArmorControl
            tag="Helmet"
            onChange={(value) => this.props.onHelmChange(value)}
            campaign={this.props.campaign}
          />
          <AddArmorControl
            onChange={(value) => this.props.onArmorChange(value)}
            campaign={this.props.campaign}
          />
          <div>
            <a href="/sheets/add_armor/">Create a new armor</a>{" "}
            <a href="/sheets/add_armor_template/">Create a new armortemplate</a>{" "}
            <a href="/sheets/add_armor_quality/">Create new quality</a>{" "}
            <a href="/sheets/add_armor_special_quality/">
              Create new special quality
            </a>
          </div>
        </Row>
      );
    }
    const armorStats = calculateArmorStats(
      this.props.armor,
      this.props.helm,
      this.props.miscellaneousItems,
      this.props.handler,
    );

    const headerStyle = { textAlign: "center", minWidth: "2.5em" };
    const cellStyle = {
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

    const woundPenalties = this.props.handler?.getWoundPenalties() ?? {};
    const damages = woundPenalties.locationsDamages;
    if (woundPenalties.bodyDamage) {
      headerCells.push(
        <th title="Current damage" style={headerStyle} key={headerCells.length}>
          Dmg
        </th>,
      );
    }
    let locations = [];
    const dice = { H: "8", T: "5-7", RA: "4", RL: "3", LA: "2", LL: "1" };
    for (let loc of ["H", "T", "RA", "RL", "LA", "LL"]) {
      let row = [];
      row.push(
        <td style={descStyle} key={loc + "-1"}>
          {dice[loc]}
        </td>,
      );
      row.push(
        <td style={descStyle} key={loc + "-2"}>
          {loc}
        </td>,
      );
      for (let col of ["P", "S", "B", "R", "DR", "DP", "PL"]) {
        row.push(
          <td style={cellStyle} key={loc + "-" + col}>
            <StatBreakdown
              label={`Armor ${loc} ${col}`}
              value={util.rounddown(armorStats[loc][col].value())}
              breakdown={armorStats[loc][col].breakdown()}
            />
          </td>,
        );
      }

      const threshold = this.props.handler?.getDamageThreshold(loc);
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
        <td
          aria-label="Overall damage reduction"
          style={{ textAlign: "center" }}
        >
          {overallDamageReduction}
        </td>
      </tr>,
    );
    let editButtonName = "Edit Armor";
    if (this.state.editing) {
      editButtonName = "Close edit";
    }

    const editAvailable = !!this.props.onArmorChange;

    return (
      <div style={this.props.style}>
        <Row>
          <Col>
            <Row>
              <Col>Helmet</Col>
              <Col>
                <span aria-label={"Current helmet"}>
                  {this.props.helm?.name}
                </span>
              </Col>
            </Row>
            <Row>
              <Col>Armor</Col>
              <Col aria-label={"Current armor"}>{this.props.armor?.name}</Col>
            </Row>
          </Col>
          {editAvailable ? (
            <Col>
              <Button
                onClick={() => this.setState({ editing: !this.state.editing })}
              >
                {editButtonName}
              </Button>
            </Col>
          ) : (
            ""
          )}
        </Row>
        {addControls}
        <table>
          <thead style={headerStyle} key={"thead"}>
            <tr>{headerCells}</tr>
          </thead>
          <tbody key={0}>{locations}</tbody>
        </table>
      </div>
    );
  }
}

ArmorControl.propTypes = {
  tag: PropTypes.string,
  armor: PropTypes.object,
  helm: PropTypes.object,
  handler: PropTypes.object,
  miscellaneousItems: PropTypes.arrayOf(PropTypes.object),
  effects: PropTypes.arrayOf(PropTypes.object),
  campaign: PropTypes.number.isRequired,
  onHelmChange: PropTypes.func,
  onArmorChange: PropTypes.func,
};

ArmorControl.defaultProps = { miscellaneousItems: [] };
export default ArmorControl;
