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
        const threshold = this.props.handler.getDamageThreshold(wound.location.toLowerCase())

        const toughness = this.props.handler?.getEdgeModifier("toughness") ?? 0;
        const effDamage = wound.damage - toughness;
        const choices = AddWoundControl.getWoundChoices(wound.location, wound.type);

        let choice
        if (effDamage < 0) {
            choice = choices[0];
        } else if (effDamage >= choices.length) {
            choice = choices[choices.length - 1];
        } else {
            choice = choices[effDamage]
        }

        // Excess damage is non-lethal, but critical effects are still calculated by the full damage (up to the maximum indicated in the table).
        // Toughness already factored in to the threshold.
        if (wound.damage > threshold) {
            const extra = choice.extra() ? ` [${choice.extra()}]` : ''

            if (wound.damage > 2*threshold) {
                const effectMap = {P: "blown to smithereens", "S": "sliced clean off", B: "obliterated", R: "burned to a crisp"}
                const locMap = {H: "Head", T: "Torso",
                                     RA: "Arm", LA: "Arm", RL: "Leg", LL: "Leg"}
                return `${locMap[wound.location]} ${effectMap[wound.type]}${extra}`
            } else {
                const effectMap = {P: "blown off", "S": "severed", B: "crushed", R: "burned through"}
                const locMap = {
                    H: "Head", T: "Torso",
                    RA: "Hand", LA: "Hand", RL: "Foot", LL: "Foot"
                }
                return `${locMap[wound.location]} ${effectMap[wound.type]}${extra}`
            }
        }

        return choice?.toString()
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

    async handleSubmit() {
        if (this.isValid() && this.props.onAdd) {
            await this.props.onAdd({
                damage: this.state.damage,
                location: this.state.selectedLocation,
                damage_type: this.state.selectedType,
                effect: this.state.effect
            })
            this.setState({
                    selectedLocation: "T",
                    selectedType: "S",
                    damage: 0,
                    effect: this.findEffect({
                        type: "S",
                        location: "T",
                        damage: 0})});
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
            this.state.selectedLocation,
            this.state.selectedType).map((w) => w.toString());

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

class WoundEffect {
    #effect = ''
    #extra = []

    constructor(effect, ...extra) {
        this.#effect = effect
        this.#extra = extra ?? []
    }

    toString() {
        const extra = this.extra().length > 0 ? ` [${this.extra()}]` : ''
        return `${this.#effect}${extra}`
    }

    extra() {
        return this.#extra.length > 0 ? `${this.#extra.join(', ')}` : '';
    }
}

const WE = WoundEffect

AddWoundControl.woundEffects = {
    H: {
        P: [new WE("Scraped"),
            new WE("Grazed"),
            new WE("Grazed", "minor ext"),
            new WE("Extremity crushed", "major ext"),
            new WE("Extremity crushed", "major ext"),
            new WE("Skull cracked", "Slug in, major int"),
            new WE("Throat punctured", "severe ext"),
            new WE("Bullet in the head", "Slug in, severe int"),
            new WE("Neck slashed half", "fatal ext"),
            new WE("Neck slashed half", "fatal ext"),
            new WE("Part blown off", "fatal int"),
            new WE("Part blown off", "fatal int"),
            new WE("Head blown off", "DEATH"),
        ],
        S: [new WE("Scratched"),
            new WE("Cut", "minor ext"),
            new WE("Cut", "minor ext"),
            new WE("Extremity punctured", "major ext"),
            new WE("Extremity punctured", "major ext"),
            new WE("Skull pierced", "major int"),
            new WE("Throat punctured", "severe ext"),
            new WE("Hole in skull", "severe int"),
            new WE("Neck slashed half", "fatal ext"),
            new WE("Neck slashed half", "fatal ext"),
            new WE("Brain punctured", "fatal int"),
            new WE("Brain punctured", "fatal int"),
            new WE("Decapitation", "DEATH"),
        ],
        B: [new WE("Bumped"),
            new WE("Concussion"),
            new WE("Concussion"),
            new WE("Eye crushed*"),
            new WE("Nose crushed*", "minor ext"),
            new WE("Severe concussion", "minor int"),
            new WE("Throat crushed", "major int"),
            new WE("Skull cracked", "severe int"),
            new WE("Neck crushed", "severe int"),
            new WE("Neck crushed", "severe int"),
            new WE("Head crushed", "fatal int"),
            new WE("Head crushed", "fatal int"),
            new WE("Neck broken", "DEATH"),
        ],
        R: [new WE("Blistered"),
            new WE("Hair burned"),
            new WE("Hair burned", "IMM"),
            new WE("Eyes burned*", "IMM -10"),
            new WE("Extremity charred*", "IMM -20"),
            new WE("Skin burned bad", "IMM -30"),
            new WE("Charred", "IMM -40"),
            new WE("Charred", "IMM -50"),
            new WE("Fatally charred", "IMM -60"),
            new WE("Fatally charred", "IMM -70"),
            new WE("Head burned through", "IMM -80"),
            new WE("Head burned through", "IMM -90"),
            new WE("Head destroyed", "DEATH"),
        ]
    },
    T: {
        P: [new WE("Scraped"),
            new WE("Grazed"),
            new WE("Grazed"),
            new WE("Rib cracked", "Slug in", "minor ext"),
            new WE("Genitalia pierced", "minor ext"),
            new WE("Gut shot", "Slug in", "minor int"),
            new WE("Gut pierced", "minor int"),
            new WE("Int. organ hit", "Slug in", "major int"),
            new WE("Int. organ pierced", "major int"),
            new WE("Lung punctured", "Slug in", "severe int"),
            new WE("Lung punctured", "severe int"),
            new WE("Heart muscle hit", "Slug in", "severe int"),
            new WE("Heart muscle pierced", "severe int"),
            new WE("Aorta hit", "Slug in", "fatal int"),
            new WE("Aorta pierced", "fatal int"),
            new WE("Massive tissue damage", "fatal int"),
            new WE("Multiple organs destroyed", "fatal int"),
            new WE("Heart shot through", "fatal int"),
            new WE("Spinal cord severed", "fatal int"),
            new WE("Spinal cord severed", "fatal int"),
            new WE("Torso destroyed", "DEATH"),
        ],
        S: [new WE("Scratched"),
            new WE("Scratched"),
            new WE("Cut", "minor ext"),
            new WE("Cut", "minor ext"),
            new WE("Genitalia cut", "minor ext"),
            new WE("Gut pierced", "minor int"),
            new WE("Gut pierced", "minor int"),
            new WE("Internal organ pierced", "major int"),
            new WE("Internal organ pierced", "major int"),
            new WE("Lung punctured", "severe int"),
            new WE("Lung punctured", "severe int"),
            new WE("Heart muscle pierced", "severe int"),
            new WE("Heart muscle pierced", "severe int"),
            new WE("Aorta cut", "fatal int"),
            new WE("Aorta cut", "fatal int"),
            new WE("Massive tissue damage", "fatal int"),
            new WE("Multiple organs destroyed", "fatal int"),
            new WE("Heart pierced", "fatal int"),
            new WE("Spinal cord severed", "fatal int"),
            new WE("Spinal cord severed", "fatal int"),
            new WE("Torso destroyed", "DEATH"),
        ],
        B: [new WE("Bruised"),
            new WE("Bruised"),
            new WE("Bruised"),
            new WE("Bruised"),
            new WE("Genitalia hit"),
            new WE("Abdomen punched", "minor int"),
            new WE("Abdomen punched", "minor int"),
            new WE("Internal organ ruptured", "major int"),
            new WE("Internal organ ruptured", "major int"),
            new WE("Lungs crushed", "severe int"),
            new WE("Lungs crushed", "severe int"),
            new WE("Internal organs ruptured", "severe int"),
            new WE("Internal organs ruptured", "severe int"),
            new WE("Massive tissue damage", "fatal int"),
            new WE("Massive tissue damage", "fatal int"),
            new WE("Massive tissue damage", "fatal int"),
            new WE("Multiple organs destroyed", "fatal int"),
            new WE("Massive tissue damage", "fatal int"),
            new WE("Spinal cord severed", "fatal int"),
            new WE("Spinal cord severed", "fatal int"),
            new WE("Torso destroyed", "DEATH"),
        ],
        R: [new WE("Blistered"),
            new WE("Burned"),
            new WE("Burned"),
            new WE("Grilled", "IMM"),
            new WE("Grilled", "IMM -5"),
            new WE("Grilled", "IMM -10"),
            new WE("Scorched", "IMM -15"),
            new WE("Scorched", "IMM -20"),
            new WE("Scorched", "IMM -25"),
            new WE("Charred", "IMM -30"),
            new WE("Charred", "IMM -35"),
            new WE("Charred", "IMM -40"),
            new WE("Charred", "IMM -45"),
            new WE("Fatally charred", "IMM -50"),
            new WE("Fatally charred", "IMM -55"),
            new WE("Fatally charred", "IMM -60"),
            new WE("Fatally charred", "IMM -65"),
            new WE("Fatally charred", "IMM -70"),
            new WE("Torso burned through", "IMM -75"),
            new WE("Torso burned through", "IMM -80"),
            new WE("Torso destroyed", "DEATH"),
        ]
    },
    RA: {
        P: [new WE("Scraped"),
            new WE("Muscle hit"),
            new WE("Grazed", "Slug in"),
            new WE("Bone hit", "minor ext"),
            new WE("Artery cut", "Slug in", "minor ext"),
            new WE("Open fracture", "major ext"),
            new WE("Shattered", "Slug in", "major ext"),
            new WE("Shattered", "severe ext"),
            new WE("Shattered", "severe ext"),
        ],
        S: [new WE("Scratched"),
            new WE("Muscle cut"),
            new WE("Bone cracked", "minor ext"),
            new WE("Artery cut", "minor ext"),
            new WE("Artery cut", "major ext"),
            new WE("Bones slashed", "major ext"),
            new WE("Shattered", "severe ext"),
            new WE("Shattered", "severe ext"),
            new WE("Shattered", "severe ext"),
        ],
        B: [new WE("Bruised"),
            new WE("Bruised"),
            new WE("Fingers broken"),
            new WE("Joint dislocated"),
            new WE("Bone cracked"),
            new WE("Shoulder broken"),
            new WE("Crushed", "minor ext"),
            new WE("Crushed", "minor ext"),
            new WE("Crushed", "major ext"),
        ],
        R: [new WE("Blistered"),
            new WE("Burned"),
            new WE("Burned"),
            new WE("Grilled", "IMM"),
            new WE("Grilled", "IMM -5"),
            new WE("Grilled", "IMM -10"),
            new WE("Scorched", "IMM -15"),
            new WE("Scorched", "IMM -20"),
            new WE("Scorched", "IMM -25"),
        ]
    },
    RL: {
        P: [new WE("Scraped"),
            new WE("Scraped"),
            new WE("Muscle hit", "Slug in"),
            new WE("Muscle pierced", "minor ext"),
            new WE("Bone hit", "Slug in", "minor ext"),
            new WE("Major vein cut", "major ext"),
            new WE("Open fracture", "Slug in", "major ext"),
            new WE("Leg artery cut", "severe ext"),
            new WE("Knee shattered", "Slug in", "severe ext"),
            new WE("Shattered", "severe ext"),
            new WE("Shattered", "fatal ext"),
        ],
        S: [new WE("Scratched"),
            new WE("Scratched"),
            new WE("Muscle cut", "minor ext"),
            new WE("Muscle cut", "minor ext"),
            new WE("Major vein cut", "major ext"),
            new WE("Major vein cut", "major ext"),
            new WE("Leg artery cut", "severe ext"),
            new WE("Bones slashed", "severe ext"),
            new WE("Bones slashed", "severe ext"),
            new WE("Shattered", "fatal ext"),
            new WE("Shattered", "fatal ext"),
        ],
        B: [new WE("Bruised"),
            new WE("Bruised"),
            new WE("Numbed "),
            new WE("Numbed "),
            new WE("Joint dislocated"),
            new WE("Joint dislocated"),
            new WE("Bone cracked", "minor ext"),
            new WE("Bone cracked", "minor ext"),
            new WE("Hip broken", "major ext"),
            new WE("Crushed", "major ext"),
            new WE("Crushed", "major ext"),
        ],
        R: [new WE("Blistered"),
            new WE("Burned"),
            new WE("Burned"),
            new WE("Grilled", "IMM"),
            new WE("Grilled", "IMM -5"),
            new WE("Grilled", "IMM -10"),
            new WE("Scorched", "IMM -15"),
            new WE("Scorched", "IMM -20"),
            new WE("Scorched", "IMM -25"),
            new WE("Charred", "IMM -30"),
            new WE("Charred", "IMM -35"),
        ]
    },
};

AddWoundControl.woundEffects.LA = AddWoundControl.woundEffects.RA;
AddWoundControl.woundEffects.LL = AddWoundControl.woundEffects.RL;

export default AddWoundControl;
