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
            effect: undefined
        };
    }

    findEffect(wound) {
        var choices = AddWoundControl.getWoundChoices(wound.location, wound.type);


        var effDamage = wound.damage - this.props.toughness;
        if (effDamage < 0) {
            return choices[0];
        }
        if (effDamage >= choices.length) {
            return choices[choices.length - 1];
        }
        return choices[effDamage];
    }

    handleDamageChange(event) {
        this.setState({damage: event.target.value,
                       effect: this.findEffect({type: this.state.selectedType,
                            location: this.state.selectedLocation,
                            damage: event.target.value})
        });
    }

    handleEffectChange(value) {
        this.setState({effect: value});
    }

    handleLocationChange(value) {
        if (typeof(value) === "object") {
            value = value.location;
        }
        this.setState({selectedLocation: value,
                       effect: this.findEffect({
                           type: this.state.selectedType,
                           location: value,
                           damage: this.state.damage})});
    }

    handleTypeChange(value) {
        if (typeof(value) === "object") {
            value = value.type;
        }
        this.setState({selectedType: value,
            effect: this.findEffect({type: value,
                            location: this.state.selectedLocation,
                            damage: this.state.damage})
        });
    }

    isValid() {
        if (!util.isInt(this.state.damage) || this.state.damage < 0) {
            return false;
        }

        if (!AddWoundControl.isLocationValid(this.state.selectedLocation) ||
            !AddWoundControl.isDamageTypeValid(this.state.selectedType)) {
            return false;
        }
        return true;
    }

    static isDamageTypeValid(type) {
        return AddWoundControl.damageTypeValues.indexOf(type) >= 0;
    }

    static isLocationValid(location) {
        return AddWoundControl.locationValues.indexOf(location) >= 0;
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

    static getWoundChoices(location, type) {
        if (!AddWoundControl.isLocationValid(location) ||
            !AddWoundControl.isDamageTypeValid(type)) {
            return [];
        }
        return AddWoundControl.woundEffects[location][type];
    }

    render() {
        var woundChoices = AddWoundControl.getWoundChoices(
            this.state.selectedLocation, this.state.selectedType);

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
            <td><Combobox data={woundChoices}
                          bsSize="small"
                          value={this.state.effect}
                          filter="contains"
                          onChange={(value) => this.handleEffectChange(value)} />
            </td>
            <td>
                <Button bsSize="small"
                        disabled={!this.isValid()}
                        ref={(c) => { if (c) { this._addButton = ReactDOM.findDOMNode(c)}}}
                        onClick={() => this.handleSubmit()}
            >Add wound</Button></td>
        </tr>;
    }
}

AddWoundControl.propTypes = {
    onAdd: React.PropTypes.func,
    toughness: React.PropTypes.number
};

AddWoundControl.defaultProps = {
    toughness: 0
};

AddWoundControl.locations = [
    {location: "H", description: "Head (8)"},
    {location: "T", description: "Torso (5-7)"},
    {location: "RA", description: "Right arm (4)"},
    {location: "RL", description: "Right leg (3)"},
    {location: "LA", description: "Left arm (2)"},
    {location: "LL", description: "Left leg (1)"}
];
AddWoundControl.locationValues = AddWoundControl.locations.map((el) => {return el.location});

AddWoundControl.damageTypes = [
    {type: "S", description: "Slash"},
    {type: "P", description: "Pierce"},
    {type: "B", description: "Bludgeon"},
    {type: "R", description: "Burn"}
];
AddWoundControl.damageTypeValues = AddWoundControl.damageTypes.map((el) => {return el.type});

AddWoundControl.woundEffects = {
    H: {
        P: ["Scraped",
"Grazed",
"Grazed [minor ext]",
"Extremity crushed [major ext]",
"Extremity crushed [major ext]",
"Skull cracked [Slug in, major int]",
"Throat punctured [severe ext]",
"Bullet in the head [Slug in, severe int]",
"Neck slashed half [fatal ext]",
"Neck slashed half [fatal ext]",
"Part blown off [fatal int]",
"Part blown off [fatal int]",
"Head blown off [DEATH]"],
        S: ["Scratched",
"Cut [minor ext]",
"Cut [minor ext]",
"Extremity punctured [major ext]",
"Extremity punctured [major ext]",
"Skull pierced [major int]",
"Throat punctured [severe ext]",
"Hole in skull [severe int]",
"Neck slashed half [fatal ext]",
"Neck slashed half [fatal ext]",
"Brain punctured [fatal int]",
"Brain punctured [fatal int]",
"Decapitation [DEATH]"],
        B: ["Bumped",
"Concussion",
"Concussion",
"Eye crushed*",
"Nose crushed* [minor ext]",
"Severe concussion [minor int]",
"Throat crushed [major int]",
"Skull cracked [severe int]",
"Neck crushed [severe int]",
"Neck crushed [severe int]",
"Head crushed [fatal int]",
"Head crushed [fatal int]",
"Neck broken [DEATH]"],
        R: ["Blistered",
"Hair burned",
"Hair burned [IMM]",
"Eyes burned* [IMM -10]",
"Extremity charred* [IMM -20]",
"Skin burned bad	 [IMM -30]",
"Charred	[IMM -40]",
"Charred	[IMM -50]",
"Fatally charred	[IMM -60]",
"Fatally charred	[IMM -70]",
"Head burned through [IMM -80]",
"Head burned through [IMM -90]",
"Head destroyed [DEATH]"]
    },
    T: {
        P: ["Scraped",
"Grazed",
"Grazed",
"Rib cracked [Slug in, minor ext]",
"Genitalia pierced [minor ext]",
"Gut shot [Slug in minor int]",
"Gut pierced [minor int]",
"Int. organ hit [Slug in, major int]",
"Int. organ pierced [major int]",
"Lung punctured [Slug in, severe int]",
"Lung punctured [severe int]",
"Heart muscle hit [Slug in, severe int]",
"Heart muscle pierced [severe int]",
"Aorta hit [Slug in, fatal int]",
"Aorta pierced [fatal int]",
"Massive tissue damage [fatal int]",
"Multiple organs destroyed [fatal int]",
"Heart shot through [fatal int]",
"Spinal cord severed [fatal int]",
"Spinal cord severed [fatal int]",
"Torso destroyed [DEATH]"],
        S: ["Scratched",
"Scratched",
"Cut [minor ext]",
"Cut [minor ext]",
"Genitalia cut [minor ext]",
"Gut pierced [minor int]",
"Gut pierced [minor int]",
"Internal organ pierced [major int]",
"Internal organ pierced [major int]",
"Lung punctured [severe int]",
"Lung punctured [severe int]",
"Heart muscle pierced [severe int]",
"Heart muscle pierced [severe int]",
"Aorta cut [fatal int]",
"Aorta cut [fatal int]",
"Massive tissue damage [fatal int]",
"Multiple organs destroyed [fatal int]",
"Heart pierced [fatal int]",
"Spinal cord severed [fatal int]",
"Spinal cord severed [fatal int]",
"Torso destroyed [DEATH]"],
        B: ["Bruised",
"Bruised",
"Bruised",
"Bruised",
"Genitalia hit",
"Abdomen punched [minor int]",
"Abdomen punched [minor int]",
"Internal organ ruptured [major int]",
"Internal organ ruptured [major int]",
"Lungs crushed [severe int]",
"Lungs crushed [severe int]",
"Internal organs ruptured [severe int]",
"Internal organs ruptured [severe int]",
"Massive tissue damage [fatal int]",
"Massive tissue damage [fatal int]",
"Massive tissue damage [fatal int]",
"Multiple organs destroyed [fatal int]",
"Massive tissue damage [fatal int]",
"Spinal cord severed [fatal int]",
"Spinal cord severed [fatal int]",
"Torso destroyed [DEATH]"],
        R: ["Blistered",
"Burned",
"Burned",
"Grilled [IMM]",
"Grilled [IMM -5]",
"Grilled [IMM -10]",
"Scorched [IMM -15]",
"Scorched [IMM -20]",
"Scorched [IMM -25]",
"Charred [IMM -30]",
"Charred [IMM -35]",
"Charred [IMM -40]",
"Charred [IMM -45]",
"Fatally charred [IMM -50]",
"Fatally charred [IMM -55]",
"Fatally charred [IMM -60]",
"Fatally charred [IMM -65]",
"Fatally charred [IMM -70]",
"Torso burned through [IMM -75]",
"Torso burned through [IMM -80]",
"Torso destroyed [DEATH]"]
    },
    RA: {
        P: ["Scraped",
"Muscle hit",
"Grazed [Slug in]",
"Bone hit [minor ext]",
"Artery cut [Slug in, minor ext]",
"Open fracture [major ext]",
"Shattered [Slug in, major ext]",
"Shattered [severe ext]",
"Shattered [severe ext]"],
        S: ["Scratched",
"Muscle cut",
"Bone cracked [minor ext]",
"Artery cut [minor ext]",
"Artery cut [major ext]",
"Bones slashed [major ext]",
"Shattered [severe ext]",
"Shattered [severe ext]",
"Shattered [severe ext]"],
        B: ["Bruised",
"Bruised",
"Fingers broken",
"Joint dislocated",
"Bone cracked",
"Shoulder broken",
"Crushed [minor ext]",
"Crushed [minor ext]",
"Crushed [major ext]"],
        R: ["Blistered",
"Burned",
"Burned",
"Grilled [IMM]",
"Grilled [IMM -5]",
"Grilled [IMM -10]",
"Scorched [IMM -15]",
"Scorched [IMM -20]",
"Scorched [IMM -25]"]
    },
    RL: {
        P: ["Scraped",
"Scraped",
"Muscle hit [Slug in]",
"Muscle pierced [minor ext]",
"Bone hit [Slug in, minor ext]",
"Major vein cut [major ext]",
"Open fracture [Slug in, major ext]",
"Leg artery cut [severe ext]",
"Knee shattered [Slug in, severe ext]",
"Shattered [severe ext]",
"Shattered [fatal ext]"],
        S: ["Scratched",
"Scratched",
"Muscle cut [minor ext]",
"Muscle cut [minor ext]",
"Major vein cut [major ext]",
"Major vein cut [major ext]",
"Leg artery cut [severe ext]",
"Bones slashed [severe ext]",
"Bones slashed [severe ext]",
"Shattered [fatal ext]",
"Shattered [fatal ext]"],
        B: ["Bruised",
"Bruised",
"Numbed ",
"Numbed ",
"Joint dislocated",
"Joint dislocated",
"Bone cracked [minor ext]",
"Bone cracked [minor ext]",
"Hip broken [major ext]",
"Crushed [major ext]",
"Crushed [major ext]"],
        R: ["Blistered",
"Burned",
"Burned",
"Grilled [IMM]",
"Grilled [IMM -5]",
"Grilled [IMM -10]",
"Scorched [IMM -15]",
"Scorched [IMM -20]",
"Scorched [IMM -25]",
"Charred [IMM -30]",
"Charred [IMM -35]"]
    },
};

AddWoundControl.woundEffects.LA = AddWoundControl.woundEffects.RA;
AddWoundControl.woundEffects.LL = AddWoundControl.woundEffects.RL;

export default AddWoundControl;
