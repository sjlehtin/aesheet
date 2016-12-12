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
        if (typeof(value) === "object") {
            value = value.location;
        }
        this.setState({selectedLocation: value});
    }

    handleTypeChange(value) {
        if (typeof(value) === "object") {
            value = value.type;
        }
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
        var types = AddWoundControl.damageTypes.map((el) => {return el.type});
        if (types.indexOf(this.state.selectedType) < 0) {
            return false;
        }
        return true;
    }

    handleSubmit() {
        if (this.isValid() && this.props.onAdd) {
            this.props.onAdd({
                damage: this.state.damage,
                location: this.state.selectedLocation,
                damage_type: this.state.selectedType,
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
        return <tr>
            <td><Combobox data={AddWoundControl.locations}
                          textField='description'
                          valueField='location'
                          bsSize="small"
                          value={this.state.selectedLocation}
                          filter="contains"
                          onChange={(value) => this.handleLocationChange(value)}
                          ref={(c) => { if (c) { this._locationField = c }}} />
            </td>
            <td><Combobox data={AddWoundControl.damageTypes}
                          textField='description'
                          valueField='type'
                          bsSize="small"
                          value={this.state.selectedType}
                          filter="contains"
                          onChange={(value) => this.handleTypeChange(value)}
                          ref={(c) => { if (c) { this._typeField = c }}} />
            </td>
            <td><Input bsSize="small" type="text" value={this.state.damage} onChange={
                (e) => this.handleDamageChange(e)}
                ref={(c) => { if (c) { this._damageInputField = c.getInputDOMNode()}}} />
            </td>
            <td>
                <Input bsSize="small" type="text" value={this.state.effect}
                       onChange={(e) => this.handleEffectChange(e)}
                       ref={(c) => { if (c) { this._effectInputField = c.getInputDOMNode()}}} />
                <Button bsSize="small"
                        disabled={!this.isValid()}
                        ref={(c) => { if (c) { this._addButton = ReactDOM.findDOMNode(c)}}}
                        onClick={() => this.handleSubmit()}
            >Add wound</Button></td>
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

AddWoundControl.damageTypes = [
    {type: "S", description: "Slash"},
    {type: "P", description: "Pierce"},
    {type: "B", description: "Bludgeon"},
    {type: "R", description: "Burn"}
];

export default AddWoundControl;
