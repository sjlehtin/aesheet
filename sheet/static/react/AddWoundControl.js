import React from 'react';
import ReactDOM from 'react-dom';
import { Button, Modal, Input, ButtonInput, Table } from 'react-bootstrap';
import Octicon from 'react-octicon'

import Combobox from 'react-widgets/lib/Combobox';

var util = require('sheet-util');
var rest = require('sheet-rest');

class AddWoundControl extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            selectedLocation: "T",
            selectedType: "S",
            damage: 0,
            effect: ""
        };
    }

    handleDamageChange(event) {
        this.setState({damage: event.target.value});
    }

    handleEffectChange(event) {
        this.setState({effect: event.target.value});
    }

    handleLocationChange(value) {
        this.setState({selectedLocation: value});
    }

    handleTypeChange(value) {
        this.setState({selectedType: value});
    }

    isValid() {
        if (!util.isInt(this.state.damage) || this.state.damage <= 0) {
            return false;
        }
        var locations = AddWoundControl.locations.map((el) => {return el.location});
        if (locations.indexOf(this.state.selectedLocation) < 0) {
            return false;
        }
        return true;
    }

    handleSubmit() {
        if (this.isValid() && this.props.onAdd) {
            this.props.onAdd({
                damage: this.state.damage,
                location: this.state.selectedLocation,
                type: this.state.selectedType,
                effect: this.state.effect
            }).then(() => {
                this.setState({
                    selectedLocation: "T",
                    selectedType: "S",
                    damage: 0, effect: ""});
            });
        }
    }

    render() {
        return <tr><td><Combobox data={AddWoundControl.locations}
                                 textField='description'
                                 value={this.state.selectedLocation}
                                 filter="contains"
                                 onChange={(value) => this.handleLocationChange(value)}
                                 ref={(c) => { if (c) { this._locationField = c }}}
                            /></td>
            <td><Input type="text" value={this.state.damage} onChange={
                (e) => this.handleDamageChange(e)}
                ref={(c) => { if (c) { this._damageInputField = c.getInputDOMNode()}}}
            /></td>
            <td>
                <Input type="text" value={this.state.effect} onChange={
                (e) => this.handleEffectChange(e)}
                ref={(c) => { if (c) { this._effectInputField = c.getInputDOMNode()}}}
            />
                <button bsSize="small"
                        ref={(c) => { if (c) { this._addButton = c}}}
                        onClick={() => this.handleSubmit()}
            >Add wound</button></td>
        </tr>;
    }
}

AddWoundControl.propTypes = {
    onAdd: React.PropTypes.func
};

AddWoundControl.locations = [
    {location: "H", description: "Head (8)"},
    {location: "T", description: "Torso (5-7)"},
    {location: "RA", description: "Right arm (4)"},
    {location: "RL", description: "Right leg (3)"},
    {location: "LA", description: "Left arm (2)"},
    {location: "LL", description: "Left leg (1)"}
];

export default AddWoundControl;
