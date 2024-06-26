import React from 'react';
import PropTypes from 'prop-types';

import { Button, FormControl, Form, Row, Col } from 'react-bootstrap';

import {DropdownList, Combobox} from 'react-widgets';

const util = require('./sheet-util');

class AddWoundControl extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            selectedLocation: "T",
            selectedType: "S",
            damage: 0,
            effect: this.findEffect({type: "S",
                            location: "T",
                            damage: 0})
        };
    }

    findEffect(wound) {
        const threshold = this.props.handler.getDamageThreshold(wound.location)

            // Toughness already factored in to the threshold.
        if (wound.damage > threshold) {
            if (wound.damage > 2*threshold) {
                const effectMap = {P: "blown to smithereens", "S": "sliced clean off", B: "obliterated", R: "burned to a crisp"}
                const locMap = {H: "Head", T: "Torso",
                                     RA: "Arm", LA: "Arm", RL: "Leg", LL: "Leg"}

                return `${locMap[wound.location]} ${effectMap[wound.type]}`
            } else {
                const effectMap = {P: "blown off", "S": "severed", B: "crushed", R: "burned through"}
                const locMap = {
                    H: "Head", T: "Torso",
                    RA: "Hand", LA: "Hand", RL: "Foot", LL: "Foot"
                }
                return `${locMap[wound.location]} ${effectMap[wound.type]}`
            }
        }

        const choices = AddWoundControl.getWoundChoices(wound.location, wound.type);

        const toughness = this.props.handler?.edgeLevel("Toughness") ?? 0;
        const effDamage = wound.damage - toughness;
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

    isDamageValid() {
        if (!util.isInt(this.state.damage) || this.state.damage < 0) {
            return false;
        }
        return true
    }

    isValid() {

        return this.isDamageValid() &&
            AddWoundControl.isLocationValid(this.state.selectedLocation) &&
            AddWoundControl.isDamageTypeValid(this.state.selectedType);
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
                    damage: 0,
                    effect: this.findEffect({type: "S",
                            location: "T",
                            damage: 0})});
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
        const woundChoices = AddWoundControl.getWoundChoices(
            this.state.selectedLocation, this.state.selectedType);


        return <div>
        <Row>
            <Col>
                <Form.Label id={"location-label"}>Location</Form.Label>
            <DropdownList style={{minWidth: "10em"}} data={AddWoundControl.locations}
                          textField='description'
                          dataKey='location'
                          value={this.state.selectedLocation}
                          filter="contains"
                          aria-label={"Location"}
                          onChange={(value) => this.handleLocationChange(value)} />
            </Col>
            <Col>
                <Form.Label>Type</Form.Label>
                <DropdownList style={{minWidth: "8em"}} data={AddWoundControl.damageTypes}
                          textField='description'
                          dataKey='type'
                          value={this.state.selectedType}
                          filter="contains"
                          aria-label={"Type"}
                          onChange={(value) => this.handleTypeChange(value)} />
            </Col>
            <Col>
                <Form.Label>Damage</Form.Label>
                <FormControl style={{minWidth: "3em"}} type="text" aria-label={"Damage"}
                             isValid={this.isDamageValid()}
                             value={this.state.damage} onChange={
                (e) => this.handleDamageChange(e)}
                />
            </Col>
                <Col>
                <Form.Label>Effect</Form.Label>
                <Combobox style={{minWidth: "10em"}} data={woundChoices}
                          aria-label={"Effect"}
                          value={this.state.effect}
                          filter="contains"
                          onChange={(value) => this.handleEffectChange(value)} />
                </Col>
                <Col className={"d-flex align-items-center"}>
                    <Button className={"my-1"} style={{verticalAlign: "middle"}} size="sm"
                        disabled={!this.isValid()}
                        onClick={() => this.handleSubmit()}>Add wound</Button>
                </Col>
            </Row>
        </div>;
    }
}

AddWoundControl.propTypes = {
    onAdd: PropTypes.func,
    handler: PropTypes.object,
    toughness: PropTypes.number
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
"Skin burned bad [IMM -30]",
"Charred [IMM -40]",
"Charred [IMM -50]",
"Fatally charred [IMM -60]",
"Fatally charred [IMM -70]",
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
