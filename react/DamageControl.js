/*
 * Stamina damage is a scalar on the Character, with similar controls
 * as stats.
 *
 * Lethal wounds are separate from each other, so they need to be
 * in many-to-one rel to Character.  A wound's fatality may decrease as it is
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
 * Further improvements:
 *
 * - separate wounds per hit location
 * - show the damages in a "straw man" view
 * - show effects, AA, FIT/REF, MOV penalties
 *
 * FIT/REF damage to RA could affect FULL and PRI, to LA could affect SEC.
 *
 */
import React from 'react';
import ReactDOM from 'react-dom';
import { Button, Modal, Input, ButtonInput, Table } from 'react-bootstrap';
import Octicon from 'react-octicon'

import SkillHandler from './SkillHandler';
import WoundRow from './WoundRow';
import WoundPenaltyBox from './WoundPenaltyBox';
import AddWoundControl from './AddWoundControl';

const util = require('./sheet-util');
const rest = require('./sheet-rest');

class DamageControl extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            currentStamina: this.props.handler.getBaseStats().stamina -
                this.props.character.stamina_damage,
            isBusy: false
        };
    }

    componentWillReceiveProps(props) {
        this.setState({currentStamina: props.handler.getBaseStats().stamina -
            this.props.character.stamina_damage});
    }

    handleSubmit(event) {
        var newValue = this.props.handler.getBaseStats().stamina -
            this.state.currentStamina;
        this.setState({isBusy: true});
        this.props.onMod('stamina_damage', this.props.character.stamina_damage,
            newValue).then(() => this.setState({isBusy: false}));
    }

    handleChange(event) {
        this.setState({currentStamina: event.target.value});
    }

    handleClear(event) {
        this.setState({currentStamina: this.props.handler.getBaseStats().stamina,
            isBusy: true});
        this.props.onMod('stamina_damage', this.props.character.stamina_damage,
            0).then(() => this.setState({isBusy: false}));
    }

    validationState() {
        return util.isInt(this.state.currentStamina) ? "success" : "error";
    }

    isValid() {
        return this.validationState() == "success";
    }

    handleKeyDown(e) {
        if (e.keyCode === 13) {
            /* Enter. */
            this.handleSubmit();
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
        var inputStyle = {width: "3em", marginLeft: "1em"};

        var loading = '';
        if (this.state.isBusy) {
            loading = <Octicon spin name="sync"/>;
        }
        var damage = '';
        if (this.props.character.stamina_damage) {
            var renderedAcPenalty, renderedInitPenalty;
            var acPenalty = this.props.handler.getACPenalty();
            var descrStyle = {marginLeft: "1em"};
            renderedAcPenalty =
                <span style={descrStyle}>{acPenalty} AC</span>;
            var initPenalty = SkillHandler.getInitPenaltyFromACPenalty(acPenalty);
            if (initPenalty) {
                renderedInitPenalty =
                    <span style={descrStyle}>{initPenalty} I</span>;
            }
            damage = <div style={{color: 'red'}}>
                -{this.props.character.stamina_damage} STA
                => {renderedAcPenalty}
                {renderedInitPenalty}
            </div>;
        }
        var bodyDamage = 0;
        var rows = this.props.wounds.map((wound, idx) => {
            bodyDamage += wound.damage - wound.healed;
            return <WoundRow key={"wound-" + idx} wound={wound}
                             onMod={(data) => this.handleWoundMod(data)}
                             onRemove={(data) => this.handleWoundRemove(data)}
            />;});
        var wounds = <Table>
                <thead>
                <tr><th style={{width: "12em"}}>Loc</th><th style={{width: "8em"}}>Type</th><th style={{width: "5em"}}>Dmg</th><th colSpan={2}>Effect</th></tr>
                </thead>
                <tbody>
                {rows}
                <AddWoundControl onAdd={(data) => this.handleWoundAdd(data)}
                                 toughness={this.props.handler.edgeLevel("Toughness")}/>
                </tbody>
            </Table>;

        var stats = this.props.handler.getBaseStats();

        var deathSymbol = '';
        if (bodyDamage >= stats.body) {
            deathSymbol = <span style={{fontSize: "200%"}}
                                title="The character is dead due to massive damage">✟</span>;
        }

        return (<div style={this.props.style}>
            <div><label>Body: </label><span style={{marginLeft: "1em"}}>{stats.body - bodyDamage} / {stats.body} {deathSymbol}</span></div>
            {damage}
            <label>Stamina: </label>
            <input ref={(c) =>
                     c ? this._inputField = ReactDOM.findDOMNode(c) : null}
                   type="text"
                   onChange={(e) => this.handleChange(e)}
                   //bsStyle={this.validationState()}
                   //hasFeedback
                   value={this.state.currentStamina}
                   onKeyDown={(e) => this.handleKeyDown(e)}
                   style={inputStyle}
            />
            <span> / {stats.stamina}</span>
            <Button
                style={{marginLeft: "1em"}}
                bsSize="xsmall"
                    ref={(c) =>
                      c ? this._changeButton = ReactDOM.findDOMNode(c) : null}
                    disabled={!this.isValid() || this.state.isBusy}
                    onClick={(e) => this.handleSubmit()}>Change{loading}</Button>

            <Button style={{marginLeft: ".5em"}}
                    bsSize="xsmall"
                    ref={(c) =>
                      c ? this._clearButton = ReactDOM.findDOMNode(c) : null}
                    disabled={!this.isValid() || this.state.isBusy}
                    onClick={(e) => this.handleClear()}>Clear{loading}</Button>
            <WoundPenaltyBox handler={this.props.handler}/>
            {wounds}
        </div>);
    }
}

DamageControl.propTypes = {
    handler: React.PropTypes.object.isRequired,
    wounds: React.PropTypes.arrayOf(React.PropTypes.object),
    onMod: React.PropTypes.func,
    onWoundMod: React.PropTypes.func,
    onWoundRemove: React.PropTypes.func,
    onWoundAdd: React.PropTypes.func
};

DamageControl.defaultProps = {
    wounds: []
};

export default DamageControl;
