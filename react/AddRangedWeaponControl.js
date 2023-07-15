import React from 'react';
import PropTypes from 'prop-types';

import {Grid, Col, Row, Label, Button} from 'react-bootstrap';

import Combobox from 'react-widgets/Combobox';

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

    componentDidMount() {
        this.loadWeapons();
        rest.getData(`/rest/weaponqualities/campaign/${this.props.campaign}/`).then(
            (json) => {
                this.setState({
                    qualityChoices: json});

            }
        ).catch((err) => console.log(err));
        rest.getData(`/rest/rangedweapons/campaign/${this.props.campaign}/`).then(
            (json) => {
                this.setState({
                    weaponChoices: json})
            }
        ).catch((err) => console.log(err));
    }

    componentDidUpdate() {
        if (this.state.weaponChoices && this.state.weaponTemplateChoices &&
            this.state.weaponQualityChoices) {
            this.setState({isBusy: false})
        }
    }

    loadWeapons() {
        this.setState({isBusy: true});
        rest.getData(`/rest/rangedweapontemplates/campaign/${this.props.campaign}/`).then(
            (json) => {
                this.setState({
                    weaponTemplateChoices: json,
                    isBusy: false})
            }
        ).catch((err) => console.log(err));
    }

    handleWeaponChange(value) {
        this.setState({selectedWeapon: value});
        if (!this.state.weaponChoices) {
            this.loadWeapons();
        }
    }

    handleQualityChange(value) {
        this.setState({selectedQuality: value})
    }

    handleAdd() {
        if (this.props.onAdd) {
            let weapon;
            if ('id' in this.state.selectedWeapon) {
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
            quality = <Combobox
                data={this.state.qualityChoices}
                value={this.state.selectedQuality}
                textField={'name'}
                onChange={(value) => this.handleQualityChange(value)}/>;
        }

        var choices = [];
        if (this.state.weaponTemplateChoices && this.state.weaponChoices) {
            choices = this.state.weaponTemplateChoices.concat(this.state.weaponChoices);
        }
        return <div>
            <Row>
                <Col sm={2}><label>Weapon</label></Col>
                <Col sm={4}><Combobox data={choices}
                                      textField='name'
                                      busy={this.state.isBusy}
                                      filter="contains"
                                      value={this.state.selectedWeapon}
                                      groupBy={(obj) => 'base' in obj ? "Existing" : "Template"}
                                      onChange={(value) => this.handleWeaponChange(value)}
                />
                </Col>
            </Row>
            <Row>
                <Col sm={2}><label>Quality</label></Col>
                <Col sm={4}>
                    {quality}
                </Col>
            </Row>
            <Row>
                <Col>
                    <Button size="sm" disabled={!this.fieldsValid()}
                            ref={(c) => this._addButton = c}
                            onClick={() => this.handleAdd()}>
                        Add Weapon</Button>
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
