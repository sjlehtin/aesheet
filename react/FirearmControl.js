import React from "react";
import PropTypes from "prop-types";

import WeaponRow from "WeaponRow";
import AmmoControl from "AmmoControl";
import ScopeControl from "ScopeControl";
import StatBreakdown from "StatBreakdown";
import MagazineControl from "MagazineControl";
import UseTypeControl from "UseTypeControl";

import * as util from "./sheet-util";
import { Badge, Button, Col, Row } from "react-bootstrap";
import { BaseCheck } from "./BaseCheck";
import { Unskilled } from "./Unskilled";
import { GoAlert } from "react-icons/go";
import { RangeInfo } from "./RangeInfo";

import FirearmModel from "./FirearmModel";

/*
 * Firearms are sheet specific. Firearms can contain add-ons, most
 * notably scopes. Add-ons affect weapon range, to-hit and target initiative,
 * among other factors.
 *
 * A firearm can have a single scope.
 *
 * The add-ons may affect the user's senses when using the firearm, notably
 * sight, which is used to calculate the range penalties for the weapon.
 *
 * TODO: There may be other add-ons, and the sheet
 * will not restrict the add-ons in any way. Use common sense on what add-ons
 * you put to a firearm (no sense in, e.g., adding both bipod and a tripod).
 */

class FirearmControl extends React.Component {
  constructor(props) {
    super(props);
  }

  renderDamage() {
    const ammo = this.props.weapon.ammo;
    let plusLeth = "";
    if (ammo.plus_leth) {
      plusLeth = ` (${util.renderInt(ammo.plus_leth)})`;
    }

    let rangeEffect = this.firearm.rangeEffect();

    if (rangeEffect === null) {
      return (
        <span className="damage">
          <strong>range too long!</strong>
        </span>
      );
    }

    return (
      <span className="damage">
        {ammo.num_dice}d{ammo.dice}
        {util.renderInt(ammo.extra_damage + rangeEffect.damage)}/
        {ammo.leth + rangeEffect.leth}
        {plusLeth}
      </span>
    );
  }

  async handleAmmoChanged(value) {
    if (this.props.onChange) {
      await this.props.onChange({
        id: this.props.weapon.id,
        ammo: value,
      });
    }
  }

  renderBurstTable() {
    if (!this.props.weapon.base.autofire_rpm) {
      return "";
    }
    const actions = [0.5, 1, 2, 3, 4];
    const burstChecks = this.firearm.burstChecks(
      actions,
      this.props.weapon.use_type,
    );
    const lethalities = [0, -2, 2, 0, -2];
    const hitLocations = [0, 0, 0, -1, -1];
    const burstRows = [];

    const baseStyle = {
      padding: 2,
      borderWidth: 1,
      minWidth: "2em",
      textAlign: "center",
    };
    const cellStyle = Object.assign({ borderStyle: "dotted" }, baseStyle);

    const actionCells = actions.map((act, ii) => {
      return (
        <th key={ii} style={baseStyle}>
          {act}
        </th>
      );
    });

    for (let ii = 0; ii < 5; ii++) {
      const checkCells = [];
      for (let jj = 0; jj < burstChecks.length; jj++) {
        let cell;
        if (burstChecks[jj][ii]) {
          cell = (
            <StatBreakdown
              value={burstChecks[jj][ii].value()}
              breakdown={burstChecks[jj][ii].breakdown()}
            />
          );
        } else {
          cell = "";
        }
        checkCells.push(
          <td key={jj} style={cellStyle} aria-label={`Burst ${jj + 1} To-Hit`}>
            {cell}
          </td>,
        );
      }
      burstRows.push(
        <tr key={`chk-${ii}`}>
          <td style={cellStyle}>{lethalities[ii]}</td>
          <td style={cellStyle}>{hitLocations[ii]}</td>
          {checkCells}
        </tr>,
      );
    }

    const inits = this.firearm.burstInitiatives(actions).map((init, ii) => {
      return <th key={"init-" + ii}>{util.renderInt(init)}</th>;
    });

    let autoUnskilled = "";
    if (!this.props.skillHandler.hasSkill("Autofire")) {
      autoUnskilled = (
        <div style={{ color: "red" }} title="Missing skill Autofire">
          Unskilled
        </div>
      );
    }

    return (
      <div>
        <table style={{ fontSize: "inherit" }}>
          <thead>
            <tr>
              <th style={baseStyle}>Leth</th>
              <th style={baseStyle}>Loc</th>
              {actionCells}
            </tr>
          </thead>
          <tbody>{burstRows}</tbody>
          <tfoot>
            <tr>
              <th />
              <th />
              {inits}
            </tr>
          </tfoot>
        </table>
        {autoUnskilled}
      </div>
    );
  }

  hasSweep() {
    return (
      this.props.weapon.base.autofire_rpm &&
      !this.props.weapon.base.sweep_fire_disabled
    );
  }

  sweepAvailable() {
    return this.hasSweep() && !this.props.inCloseCombat;
  }

  renderSweepTable() {
    if (!this.hasSweep()) {
      return "";
    }

    if (this.props.inCloseCombat) {
      return (
        <div className={"p-1"}>
          <Badge bg="warning">
            <GoAlert size={"2em"} />
          </Badge>{" "}
          Sweep fire not available in close combat!
        </div>
      );
    }

    var sweepRows = [];

    var baseStyle = {
      padding: 2,
      borderWidth: 1,
      minWidth: "2em",
      textAlign: "center",
    };
    var cellStyle = Object.assign({ borderStyle: "dotted" }, baseStyle);

    for (let sweep of [5, 10, 15, 20]) {
      let checks = this.firearm.sweepChecks(sweep);
      for (let ii = checks.length; ii < 16; ii++) {
        checks[ii] = null;
      }
      checks.reverse();
      const checkCells = checks.map((chk, index) => {
        let cell;
        if (chk) {
          cell = (
            <StatBreakdown value={chk.value()} breakdown={chk.breakdown()} />
          );
        } else {
          cell = "";
        }
        return (
          <td
            style={cellStyle}
            key={index}
            aria-label={`Sweep ${sweep} to-hit`}
          >
            {cell}
          </td>
        );
      });
      sweepRows.push(
        <tr key={sweep}>
          <td>{sweep}</td>
          <td>
            {util.roundup(this.props.weapon.base.autofire_rpm / (6 * sweep))}
          </td>
          {checkCells}
        </tr>,
      );
    }

    const footCellStyle = { textAlign: "center" };

    const hits = new Array(16).fill().map((_, ii) => (
      <th style={{ fontSize: "60%", textAlign: "center" }} key={"header-" + ii}>
        {16 - ii} hit
      </th>
    ));
    return (
      <div>
        <table style={{ fontSize: "inherit" }} aria-label={"Sweep fire to-hit"}>
          <thead>
            <tr>
              <th colSpan={4}>
                Sweep fire {this.props.weapon.base.autofire_rpm}
                {this.props.weapon.base.autofire_class}
              </th>
            </tr>
            <tr>
              <th>RPT</th>
              <th>TGT</th>
              {hits}
            </tr>
          </thead>
          <tbody>{sweepRows}</tbody>
          <tfoot>
            <tr>
              <th colSpan={2}>Lethality</th>
              <th style={footCellStyle}>0</th>
              <th style={footCellStyle}>+2</th>
              <th style={footCellStyle}>-2</th>
              <th style={footCellStyle}>0</th>
              <th style={footCellStyle}>+2</th>
              <th style={footCellStyle}>-2</th>
              <th style={footCellStyle}>0</th>
              <th style={footCellStyle}>+2</th>
              <th style={footCellStyle}>-2</th>
              <th style={footCellStyle}>0</th>
              <th style={footCellStyle}>+2</th>
              <th style={footCellStyle}>-2</th>
              <th style={footCellStyle}>0</th>
              <th style={footCellStyle}>+2</th>
              <th style={footCellStyle}>-2</th>
              <th style={footCellStyle}>0</th>
            </tr>
            <tr>
              <th colSpan={2}>Location</th>
              <th style={footCellStyle}>0</th>
              <th style={footCellStyle}>+2</th>
              <th style={footCellStyle}>+2</th>
              <th style={footCellStyle}>+2</th>
              <th style={footCellStyle}>-2</th>
              <th style={footCellStyle}>-2</th>
              <th style={footCellStyle}>-2</th>
              <th style={footCellStyle}>+1</th>
              <th style={footCellStyle}>+1</th>
              <th style={footCellStyle}>+1</th>
              <th style={footCellStyle}>-1</th>
              <th style={footCellStyle}>-1</th>
              <th style={footCellStyle}>-1</th>
              <th style={footCellStyle}>0</th>
              <th style={footCellStyle}>0</th>
              <th style={footCellStyle}>0</th>
            </tr>
          </tfoot>
        </table>
      </div>
    );
  }

  async handleScopeRemove() {
    await this.handleScopeChanged(null);
  }

  handleScopeChanged(value) {
      return this.props.onChange({
        id: this.props.weapon.id,
        scope: value,
      });
  }

  async handleUseTypeChange(useType) {
    if (this.props.onChange) {
      await this.props.onChange({
        id: this.props.weapon.id,
        use_type: useType,
      });
    }
  }

  
  render() {
    const weapon = this.props.weapon.base;

    this.firearm = new FirearmModel(
      this.props.skillHandler,
      this.props.weapon,
      this.props.inCloseCombat,
      this.props.toRange,
      this.props.darknessDetectionLevel,
    );

    const actions = this.props.inCloseCombat
      ? [0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5]
      : [0.5, 1, 2, 3, 4, 5, 6, 7, 8, 9];

    const headerStyle = { padding: 2 };
    const inlineHeaderStyle = Object.assign({}, headerStyle, {
      textAlign: "center",
    });

    const actionCells = actions.map((act, ii) => {
      return (
        <th key={`act-${ii}`} style={headerStyle}>
          {act}
        </th>
      );
    });

    const cellStyle = {
      padding: 2,
      minWidth: "2em",
      textAlign: "center",
      backgroundColor: "rgba(255, 255, 255, 0.5)",
    };
    const firstCellStyle = Object.assign({}, cellStyle, { minWidth: "8em" });
    const helpStyle = Object.assign({ color: "hotpink" }, cellStyle);
    const initStyle = Object.assign({ color: "red" }, cellStyle);

    const initiatives = this.firearm
      .initiatives(actions, {})
      .map((init, ii) => {
        return (
          <td key={`init-${ii}`} style={initStyle}>
            {util.renderInt(init)}
          </td>
        );
      });

    const baseCheck = this.firearm.skillCheck();

    let skillChecks = this.firearm.skillChecksV2(
      actions,
      this.props.weapon.use_type,
    );
    if (skillChecks == null) {
      skillChecks = (
        <td colSpan={10}>
          <strong>No attacks</strong>
        </td>
      );
    } else {
      if (weapon.autofire_only && !this.props.inCloseCombat) {
        skillChecks = (
          <td colSpan={10}>
            <em>Weapon only supports autofire.</em>
          </td>
        );
      } else {
        skillChecks = skillChecks.map((chk, ii) => {
          let cellContent;
          if (chk) {
            cellContent = <StatBreakdown value={chk} />;
          } else {
            cellContent = "";
          }
          return (
            <td key={`chk-${ii}`} style={cellStyle}>
              {cellContent}
            </td>
          );
        });
      }
    }

    const marginRightStyle = { marginRight: "1em" };
    const labelStyle = { marginRight: "0.5em" };

    const sweepInstructions = this.sweepAvailable() ? (
      <Row style={{ color: "hotpink" }}>
        <Col>
          <div>
            The distance between sweep targets may be up to 1 m (-5 penalty /
            target), or up to 2 m (-10 penalty / target).
          </div>

          <div>
            All range penalties are doubled in sweep fire (i.e. M -20, L -40, XL
            -60, E -80) (included in the calculated checks)
          </div>
          <div>Bumping is not allowed in sweep fire.</div>
        </Col>
      </Row>
    ) : (
      ""
    );

    let scope = this.props.weapon.scope || {};

    const backgroundStyle = {
      scale: "800%",
      position: "absolute",
      fontWeight: "bold",
      transform: "rotate(-15deg)",
      color: "rgba(234,16,223,0.68)",
      top: "80px",
      left: "400px",
      zIndex: 0,
    };

    const rootStyle = Object.assign({}, this.props.style, {
      position: "relative",
    });
    const backgroundText =
      this.props.weapon.use_type !== WeaponRow.FULL ? (
        <div style={backgroundStyle}>{this.props.weapon.use_type}</div>
      ) : (
        ""
      );

      function formatList(numbers) {
        if (numbers.length === 0) return "";
        if (numbers.length === 1) return numbers[0].toString();
        if (numbers.length === 2) return numbers.join(" and ");

        const allButLast = numbers.slice(0, -1).join(", ");
        const last = numbers[numbers.length - 1];
        return `${allButLast}, and ${last}`;
      }

    const ccHits = this.firearm.ccHits(this.props.weapon.use_type);
    const singleDescription = ccHits.single ? (
      <>
        With single fire, {ccHits.single} shot{ccHits.single !== 1 ? "s" : ""}{" "}
        can be fired at the opponent
      </>
    ) : (
      ""
    );
    const burstDescription = ccHits.bursts ? (
      <>
        With burst fire, {ccHits.bursts.length} burst
        {ccHits.bursts.length !== 1 ? "s" : ""}, with {formatList(ccHits.bursts)}{" "}
        hits. Shots are at +0, -2, and +2 lethality.
      </>
    ) : (
      ""
    );
    const listItemStyle = { listStyleType: "disc" };
    const ccHitDescription = (
      <div
        style={
          {
            // padding: "0.5em"
          }
        }
      >
        <p>
          On a successful CC check (ROF:{" "}
          <StatBreakdown
            label={"ROF"}
            value={this.firearm.rof(this.props.weapon.use_type)}
            style={{ display: "inline-block" }}
          />
          ):
        </p>
        <ul>
          {singleDescription ? (
            <li style={listItemStyle}>{singleDescription}</li>
          ) : (
            ""
          )}
          {burstDescription ? (
            <li style={listItemStyle}>{burstDescription}</li>
          ) : (
            ""
          )}
        </ul>
      </div>
    );
    const rateLabel = this.props.inCloseCombat ? "ROA" : "ROF";
    return (
      <div
        aria-label={`Firearm ${this.props.weapon.base.name}`}
        style={rootStyle}
      >
        <Row>
          <Col xs={"auto"}>
            <Row>
              <Col md={"auto"}>
                <div
                  style={{
                    fontSize: "inherit",
                    position: "relative",
                    zIndex: 1,
                    backgroundColor: "rgba(255, 255, 255, 0.0)",
                  }}
                >
                  <table
                    style={{
                      fontSize: "inherit",
                      backgroundColor: "rgba(255, 255, 255, 0.5)",
                    }}
                  >
                    <thead>
                      <tr>
                        <th style={headerStyle}>Weapon</th>
                        <th style={headerStyle}>Lvl</th>
                        <th style={headerStyle}>{rateLabel}</th>
                        {actionCells}
                        <th style={headerStyle}>TI</th>
                        <th style={headerStyle}>DI</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr aria-label={"Actions"}>
                        <td rowSpan="2" style={cellStyle}>
                          <div>
                            {weapon.name}
                            <Unskilled
                              missingSkills={this.firearm.missingSkills()}
                            />
                            <BaseCheck baseCheck={baseCheck} />
                          </div>
                        </td>
                        <td style={cellStyle} aria-label="Skill level">
                          {this.firearm.skillLevel()}
                        </td>
                        <td style={cellStyle} aria-label={"Rate of action"}>
                          <StatBreakdown
                            label={rateLabel}
                            value={this.firearm.roa(this.props.weapon.use_type)}
                          />
                        </td>
                        {skillChecks}
                        <td
                          style={cellStyle}
                          aria-label={"Target initiative"}
                        >{`${util.renderInt(this.firearm.targetInitiative())}`}</td>
                        <td style={cellStyle}>{weapon.draw_initiative}</td>
                      </tr>
                      <tr aria-label={"Initiatives"}>
                        <td style={helpStyle} colSpan={2}>
                          I vs. 1 target
                        </td>
                        {initiatives}
                      </tr>
                      <tr>
                        <td style={firstCellStyle} rowSpan={2}>
                          <AmmoControl
                            ammo={this.props.weapon.ammo}
                            url={`/rest/ammunition/firearm/${encodeURIComponent(this.props.weapon.base.name)}/`}
                            onChange={async (value) =>
                              await this.handleAmmoChanged(value)
                            }
                          />
                        </td>
                        <th style={inlineHeaderStyle} colSpan={3}>
                          Damage
                        </th>
                        <th style={inlineHeaderStyle} colSpan={2}>
                          Dtype
                        </th>
                        <th style={inlineHeaderStyle} colSpan={2}>
                          S
                        </th>
                        <th style={inlineHeaderStyle} colSpan={2}>
                          M
                        </th>
                        <th style={inlineHeaderStyle} colSpan={2}>
                          L
                        </th>
                      </tr>
                      <tr>
                        <td style={cellStyle} colSpan={3} aria-label={"Damage"}>
                          {this.renderDamage()}
                        </td>
                        <td style={cellStyle} colSpan={2}>
                          {this.props.weapon.ammo.type}
                        </td>
                        <td
                          style={cellStyle}
                          colSpan={2}
                          aria-label={"Short range"}
                        >
                          {this.firearm.shortRange()}
                        </td>
                        <td
                          style={cellStyle}
                          colSpan={2}
                          aria-label={"Medium range"}
                        >
                          {this.firearm.mediumRange()}
                        </td>
                        <td
                          style={cellStyle}
                          colSpan={2}
                          aria-label={"Long range"}
                        >
                          {this.firearm.longRange()}
                        </td>
                      </tr>
                      <tr>
                        <td style={firstCellStyle} rowSpan={3}>
                          <ScopeControl
                            scope={this.props.weapon.scope}
                            url={`/rest/scopes/campaign/${this.props.campaign}/`}
                            onChange={async (value) =>
                              await this.handleScopeChanged(value)
                            }
                          />
                          <UseTypeControl
                            useType={this.props.weapon.use_type}
                            onChange={async (value) =>
                              await this.handleUseTypeChange(value)
                            }
                          />
                        </td>
                        <th style={inlineHeaderStyle} colSpan={2}>
                          Weight
                        </th>
                        <th style={inlineHeaderStyle} colSpan={2}>
                          Sight
                        </th>
                        <th style={inlineHeaderStyle} colSpan={2}>
                          <span style={{ whiteSpace: "nowrap" }}>Target-I</span>
                        </th>
                        <th style={inlineHeaderStyle} colSpan={6}>
                          Notes
                        </th>
                      </tr>
                      <tr title={"Modifiers counted into checks already"}>
                        <td style={cellStyle} colSpan={2}>
                          {scope.weight}
                        </td>
                        <td style={cellStyle} colSpan={2}>
                          {scope.sight}
                        </td>
                        <td style={cellStyle} colSpan={2}>
                          {scope.target_i_mod}
                        </td>
                        <td style={cellStyle} colSpan={6}>
                          {scope.notes}
                        </td>
                      </tr>
                      <tr>
                        <td colSpan={2}>
                          {scope.perks?.length && <strong>Perks</strong>}
                        </td>
                        <td colSpan={10}>
                          {scope.perks?.map((p, index) => {
                            return (
                              <span
                                key={`perk-${index}`}
                              >{`${p.edge.name} ${p.level}`}</span>
                            );
                          })}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {backgroundText}

                <div>
                  <span style={marginRightStyle}>
                    <label style={labelStyle}>Durability:</label>
                    {weapon.durability}
                  </span>
                  <span style={marginRightStyle}>
                    <label style={labelStyle}>Weight:</label>
                    {parseFloat(weapon.weight).toFixed(2)} kg
                  </span>
                  <span style={marginRightStyle}>
                    <label style={labelStyle}>Use type:</label>
                    <span aria-label={"Use type"}>
                      {this.props.weapon.use_type}
                    </span>
                  </span>
                </div>
              </Col>
              <Col md={3}>
                {this.props.inCloseCombat
                  ? ccHitDescription
                  : this.renderBurstTable()}
              </Col>
            </Row>
            <Row>
              <Col>
                <RangeInfo
                  rangeEffect={this.firearm.rangeEffect(this.props.toRange)}
                />
              </Col>
            </Row>
            <Row>
              <Col>{this.renderSweepTable()}</Col>
            </Row>
            <MagazineControl
              firearm={this.props.weapon}
              onRemove={async (mag) => {
                await this.props.onMagazineRemove(mag);
              }}
              onAdd={async (mag) => {
                await this.props.onMagazineAdd(mag);
              }}
              onChange={async (mag) => {
                await this.props.onMagazineChange(mag);
              }}
            />
          </Col>
        </Row>
        {sweepInstructions}
        <Button
          onClick={(e) => this.props.onRemove({ id: this.props.weapon.id })}
          size="sm"
        >
          Remove firearm
        </Button>
      </div>
    );
  }
}

FirearmControl.propTypes = {
  skillHandler: PropTypes.object.isRequired,
  weapon: PropTypes.object.isRequired,
  campaign: PropTypes.number.isRequired,
  toRange: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  inCloseCombat: PropTypes.bool,
  darknessDetectionLevel: PropTypes.number,
  onRemove: PropTypes.func,
  onChange: PropTypes.func,
  onMagazineRemove: PropTypes.func,
  onMagazineAdd: PropTypes.func,
  onMagazineChange: PropTypes.func,
};

FirearmControl.defaultProps = {
  toRange: "",
  darknessDetectionLevel: 0,
  inCloseCombat: false,
};

export default FirearmControl;
