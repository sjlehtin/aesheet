import React from 'react';
import PropTypes from 'prop-types';

import {Grid, Col, Row, Label, Button} from 'react-bootstrap';

import DropdownList from "react-widgets/DropdownList";

const rest = require('./sheet-rest');

class AddRangedWeaponControl extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            isBusy: true,
            isOpen: false,
            qualityChoices: [],
            weaponChoices: [],
            weaponTemplateChoices: []
        }
    }

    async componentDidMount() {
        let promises = [];
        // TODO: should use some kind of dependency injection to not load the same data multiple times.
        promises.push(rest.getData(`/rest/weaponqualities/campaign/${this.props.campaign}/`))
        promises.push(rest.getData(`/rest/rangedweapons/campaign/${this.props.campaign}/`))
        promises.push(rest.getData(`/rest/rangedweapontemplates/campaign/${this.props.campaign}/`))
        let [qualities, weapons, templates] = await Promise.all(promises);

        this.setState({
            qualityChoices: qualities,
            weaponTemplateChoices: templates,
            weaponChoices: weapons,
            isBusy: false
        })
    }

    handleWeaponChange(value) {
        this.setState({selectedWeapon: value});
    }

    handleQualityChange(value) {
        this.setState({selectedQuality: value})
    }

    handleAdd() {
        if (this.props.onAdd) {
            let weapon;
            if (this.state.selectedWeapon.base !== undefined) {
                weapon = this.state.selectedWeapon;
            } else {
                weapon = {
                    base: this.state.selectedWeapon,
                    quality: this.state.selectedQuality,
                    special_qualities: [],
                    size: 1
                }
            }
            this.props.onAdd(weapon);

            this.setState({selectedQuality: null, selectedWeapon: null});
        }
    }

    fieldsValid() {
        if (!this.state.selectedWeapon) {
            return false;
        }
        if (typeof(this.state.selectedWeapon) !== "object") {
            return false;
        }
        if (this.state.selectedWeapon.base) {
            return true;
        }
        return typeof(this.state.selectedQuality) === "object";
    }

    render () {
        var quality;

        if (this.state.selectedWeapon && this.state.selectedWeapon.quality) {
            quality = <span>{this.state.selectedWeapon.quality.name}</span>
        } else {
            quality = <DropdownList
                data={this.state.qualityChoices}
                value={this.state.selectedQuality}
                aria-labelledby="ranged-weapon-quality-choice"
                textField={'name'}
                onChange={(value) => this.handleQualityChange(value)}/>;
        }

        var choices = [];
        if (this.state.weaponTemplateChoices && this.state.weaponChoices) {
            choices = this.state.weaponTemplateChoices.concat(this.state.weaponChoices);
        }
        return <div>
            <Row>
                <Col sm={2}><label id="ranged-weapon-choice">Ranged Weapon</label></Col>
                <Col sm={4}><DropdownList data={choices}
                                      textField='name'
                                      busy={this.state.isBusy}
                                          aria-labelledby="ranged-weapon-choice"
                                      filter="contains"
                                      value={this.state.selectedWeapon}
                                      groupBy={(obj) => 'base' in obj ? "Existing" : "Template"}
                                      onChange={(value) => this.handleWeaponChange(value)}
                />
                </Col>
            </Row>
            <Row>
                <Col sm={2}><label id="ranged-weapon-quality-choice">Ranged Weapon Quality</label></Col>
                <Col sm={4}>
                    {quality}
                </Col>
            </Row>
            <Row>
                <Col>
                    <Button size="sm" disabled={!this.fieldsValid()}
                            ref={(c) => this._addButton = c}
                            onClick={() => this.handleAdd()}>
                        Add Ranged Weapon</Button>
                </Col>
            </Row>
            <Row>
                <Col>
                    <div><a href="/sheets/add_ranged_weapon/">Create a new
                        weapon</a>
                        <a href="/sheets/add_ranged_weapon_template/">Create a
                            new weapontemplate</a>
                        <a href="/sheets/add_weapon_quality/">Create new
                            quality</a>
                        <a href="/sheets/add_weapon_special_quality/">Create
                            new special quality</a>
                    </div>
                </Col>
            </Row>
        </div>
    }
}

AddRangedWeaponControl.propTypes = {
    campaign: PropTypes.number.isRequired,
    onAdd: PropTypes.func
};

export default AddRangedWeaponControl;
