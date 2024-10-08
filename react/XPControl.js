import React from 'react';
import PropTypes from 'prop-types';

import { Button, Modal, FormControl, Form } from 'react-bootstrap';

const util = require('./sheet-util');
const rest = require('./sheet-rest');

class XPControl extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            initialTotalXP: this.props.initialChar.total_xp,
            totalXP: this.props.initialChar.total_xp,
            addXP: 0,
            showDialog: false
        };
    }

    static calculateStatRaises (char) {
        var sum = 0;
        ["fit", "ref", "lrn", "int", "psy", "wil", "cha",
            "pos"].forEach((stat) => {
            sum += parseInt(char["cur_" + stat]) -
                parseInt(char["start_" + stat]);
        });
        sum += char.bought_mana;
        sum += char.bought_stamina;

        return sum;
    };

    xpEdgesBought() {
        var sum = this.props.edgesBought - this.props.initialChar.free_edges;
        if (sum < 0) {
            sum = 0;
        }
        return sum * 25;
    }

    handleSubmit(event) {
        event.preventDefault();
        var oldValue = this.state.initialTotalXP;
        var newValue = this.state.initialTotalXP + parseInt(this.state.addXP);
        rest.patch(this.props.url, {total_xp: newValue}).then(
            (data) => {
                this.setState({initialTotalXP: newValue,
                    addXP: 0, showDialog: false });
                this.props.onMod('total_xp', oldValue, newValue);
            }
        ).catch((err) => {console.log("Error in adding XP:", err);
            this.setState({initialTotalXP: oldValue });
        })
    }

    showEditControl() {
        this.setState({showDialog: true});
    }

    handleChange(event) {
        this.setState({addXP: event.target.value});
    }

    handleCancel() {
        this.setState({addXP: 0, showDialog: false});
    }

    isValid() {
        return util.isInt(this.state.addXP);
    }

    render() {
        var totalXP = 0;
        var xpStatsBought = XPControl.calculateStatRaises(this.props.initialChar) * 5;
        totalXP += xpStatsBought;
        var xpEdgesBought = this.xpEdgesBought();
        totalXP += xpEdgesBought;
        totalXP += this.props.initialChar.xp_used_ingame;

        var hero;

        if (this.props.initialChar.hero) {
            hero = <span><span title="Hero">100</span><span> + </span></span>;
            totalXP += 100;
        }
        var stat = {fontWeight: "bold", paddingRight: 5};
        var xpWarning = "";
        if (totalXP > this.props.initialChar.total_xp) {
            xpWarning = <div style={{color: "red"}}>Too much XP used!</div>;
        }
        return (<div><span style={stat}>XP:</span>
            <span title="Stats, stamina and mana bought">{xpStatsBought}</span><span> + </span>
            {hero}
            <span aria-label={"XP used for edges"}
                  title={`${this.props.edgesBought} edges bought, ${this
                      .props.initialChar.free_edges} free edges`}>{xpEdgesBought}</span><span> + </span>
            <span
                title="XP used ingame">{this.props.initialChar.xp_used_ingame}</span>
            <span> = <span title="Used XP">{totalXP}
            </span> / <span title="Total XP">{this.props.initialChar.total_xp}
            </span>
            </span>
            <span style={{paddingLeft: 5}}>
                <Button size="sm"
                        ref={(c) => this._addButton = c}
                        onClick={this.showEditControl.bind(this)}>
                    Add XP</Button></span>
            <Modal title={"Add XP"} show={this.state.showDialog} keyboard
                   onHide={this.handleCancel.bind(this)}>
                <Modal.Header closeButton={true}><Modal.Title>Add
                    XP</Modal.Title></Modal.Header>
                <Modal.Body>
                    <Form.Label id={"add-xp-input"}>Add XP</Form.Label>
                    <FormControl type="text"
                                 label="Add XP"
                                 name={"add-xp-input"}
                                 aria-labelledby={"add-xp-input"}
                                 autoFocus
                                 onChange={this.handleChange.bind(this)}
                                 isValid={this.isValid()}
                                 className="col-xs-2"
                                 value={this.state.addXP}/>
                </Modal.Body>
                <Modal.Footer>
                    <Button onClick={(e) => {
                                this.handleSubmit(e);
                            }}
                            disabled={!this.isValid()}
                            variant="primary">Add</Button>
                </Modal.Footer>
            </Modal>
            {xpWarning}
        </div>);
    }
}

XPControl.propTypes = {
    url: PropTypes.string.isRequired,
    edgesBought: PropTypes.number.isRequired,
    initialChar: PropTypes.object.isRequired,
    onMod: PropTypes.func
};

export default XPControl;
