/*
 * Stamina damage is a scalar on the Sheet, with similar controls
 * as stats.
 *
 * Lethal wounds are separate from each other, so they need to be
 * in many-to-one rel to Sheet.  A wound's fatality may decrease as it is
 * healed, or increase due to bleeding.  In any case, the original wound
 * does not change due to either.  The current damage or the healed amount
 * changes, but the effect stays the same.
 *
 * When adding wounds, the wound description, AA penalties, etc need to be
 * filled in, but be editable at this point, due to the fact that there
 * are often special circumstances when characters are wounded, esp. in
 * fantasy or scifi campaigns where characters and enemies are more powerful.
 *
 * Lethal wounds need to be separated by location, as Toughness applies
 * per location.
 */

/*
 * Damage threshold
 *
 * Calculate effect as indicated in the rules and treat damage in excess of
 * threshold as penalty on the stamina. This allows to naturally heal
 * the wounds which will then restore the stamina to normal as the excess
 * damage is healed.
 *
 * The effect of the wound should factor in previous damage to the
 * hit-location per the example in the rules "5.3.3 Limb damage threshold".
 *
 */

/*
 * Further improvements:
 *
 * + separate wounds per hit location
 * - show the damages in a "straw man" view
 * + show effects, AA, FIT/REF, MOV penalties
 * - FIT/REF damage to RA could affect FULL and PRI,
 *   to LA could affect SEC and FULL.
 *
 */

import React from 'react';
import PropTypes from 'prop-types';

import { Button, Table, Card, Form, Col, Row } from 'react-bootstrap';

import SkillHandler from './SkillHandler';
import WoundRow from './WoundRow';
import WoundPenaltyBox from './WoundPenaltyBox';
import AddWoundControl from './AddWoundControl';
import Loading from 'Loading'

const util = require('./sheet-util');

class DamageControl extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            currentStaminaDamage: "",
            isBusy: false
        };
    }

    async handleSubmit(event) {
        this.setState({isBusy: true});
        await this.props.onMod('stamina_damage', this.props.sheet.stamina_damage,
            this.props.sheet.stamina_damage + parseInt(this.state.currentStaminaDamage))
        this.setState({isBusy: false, currentStaminaDamage: ""})
    }

    handleChange(event) {
        this.setState({currentStaminaDamage: event.target.value});
    }

    async handleClear(event) {
        this.setState({currentStaminaDamage: "",
            isBusy: true});
        await this.props.onMod('stamina_damage',
            this.props.sheet.stamina_damage,
            0)
        this.setState({isBusy: false});
    }

    isValid() {
        return util.isInt(this.state.currentStaminaDamage) && parseInt(this.state.currentStaminaDamage) !== 0;
    }

    async handleKeyDown(e) {
        if (e.code === "Enter") {
            /* Enter. */
            await this.handleSubmit();
            e.stopPropagation()
        }
    }

    handleWoundMod(data) {
        if (this.props.onWoundMod) {
            return this.props.onWoundMod(data);
        }
    }

    handleWoundRemove(data) {
        if (this.props.onWoundRemove) {
            return this.props.onWoundRemove(data);
        }
    }

    handleWoundAdd(data) {
        if (this.props.onWoundAdd) {
            return this.props.onWoundAdd(data);
        }
        return Promise.resolve({});
    }

    render() {
        const inputStyle = {width: "6em", textAlign: "right", marginLeft: "1em"};

        var loading = '';
        if (this.state.isBusy) {
            loading = <Loading />;
        }
        var rows = this.props.wounds.map((wound, idx) => {
            return <WoundRow key={"wound-" + idx} wound={wound}
                             onMod={(data) => this.handleWoundMod(data)}
                             onRemove={(data) => this.handleWoundRemove(data)}
            />;});
        var wounds = <Table>
                <thead>
                <tr><th style={{width: "8em"}}>Loc</th><th style={{width: "8em"}}>Type</th><th style={{width: "5em"}}>Dmg</th><th colSpan={2} style={{minWidth: "10em"}}>Effect</th></tr>
                </thead>
                <tbody>
                {rows}
                </tbody>
            </Table>;

        var stats = this.props.handler.getBaseStats();

        var deathSymbol = '';
        if (this.props.handler.getCurrentBody() <= 0) {
            deathSymbol = <span style={{fontSize: "200%"}}
                                title="The character is dead due to massive damage">✟</span>;
        }

        return (
            <Card className={"m-1"}>
                <Card.Header>
                    <h4>Stamina damage and wounds</h4>
                </Card.Header>
                <Card.Body className={"table-responsive"}>
                    <div>
                        <Row>
                            <Col md={"1"}>
                                <label>Body</label>
                            </Col>
                            <Col md={"auto"}>
                                <div style={this.props.style}>
                                <span style={{marginLeft: "1em"}}
                                      aria-label={"Current body"}>{this.props.handler.getCurrentBody()} / {stats.body} {deathSymbol}</span>
                                </div>
                            </Col>
                        </Row>
                        <Row>
                            <Col md={"1"}>
                                <label>Stamina</label>
                            </Col>
                            <Col md={"auto"}>
                                <div style={this.props.style}>
                                <span style={{marginLeft: "1em"}}
                                      aria-label={"Current stamina"}>{this.props.handler.getCurrentStamina()} / {stats.stamina} </span>
                                </div>
                            </Col>
                        </Row>
                        <Row>
                            <Col md={"1"}>
                                <Form.Label htmlFor={"stamina-damage"}>Stamina
                                    damage</Form.Label>
                            </Col>
                            <Col md={"auto"}>
                                <Form.Control
                                    type="text"
                                    onChange={(e) => this.handleChange(e)}
                                    id={"stamina-damage"}
                                    isValid={this.isValid()}
                                    value={this.state.currentStaminaDamage}
                                    onKeyDown={async (e) => await this.handleKeyDown(e)}
                                    style={inputStyle}
                                />
                            </Col>
                            <Col md={"auto"}>
                                <Button
                                    style={{marginLeft: "1em"}}
                                    size="sm"
                                    disabled={!this.isValid() || this.state.isBusy}
                                    onClick={async (e) => await this.handleSubmit()}>Add{loading}</Button>
                            </Col>
                            <Col md={"auto"}>
                                <Button style={{marginLeft: ".5em"}}
                                        size="sm"
                                        disabled={this.state.isBusy || parseInt(this.props.sheet.stamina_damage) === 0}
                                        id={"clear-stamina-damage"}
                                        onClick={async (e) => await this.handleClear()}>Heal{loading}</Button>
                            </Col>
                        </Row>
                        <WoundPenaltyBox handler={this.props.handler} />
                        {wounds}
                    </div>
                </Card.Body>
                <Card.Footer>
                    <AddWoundControl
                        onAdd={(data) => this.handleWoundAdd(data)}
                        handler={this.props.handler}/>
                </Card.Footer>
            </Card>);
    }
}

DamageControl.propTypes = {
    handler: PropTypes.object.isRequired,
    wounds: PropTypes.arrayOf(PropTypes.object),
    onMod: PropTypes.func,
    onWoundMod: PropTypes.func,
    onWoundRemove: PropTypes.func,
    onWoundAdd: PropTypes.func
};

DamageControl.defaultProps = {
    wounds: []
};

export default DamageControl;
