import React from 'react';
import PropTypes from 'prop-types';

import {Button, Col, Row} from 'react-bootstrap';

import Loading from './Loading';

import DropdownList from "react-widgets/DropdownList";

const rest = require('./sheet-rest');

class AddWeaponControl extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            isBusy: true,
        }
    }

    async componentDidMount() {
        let promises = [];
        promises.push(rest.getData(`/rest/weaponqualities/campaign/${this.props.campaign}/`));
        promises.push(rest.getData(`/rest/weapons/campaign/${this.props.campaign}/`));
        promises.push(rest.getData(`/rest/weapontemplates/campaign/${this.props.campaign}/`));
        let [qualities, weapons, templates] = await Promise.all(promises);

        const normalQuality = qualities.find((q) => {return /normal/i.exec(q.name);});

        this.setState({
            weaponChoices: weapons,
            qualityChoices: qualities,
            weaponTemplateChoices: templates,
            selectedQuality: normalQuality,
            defaultQuality: normalQuality,
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

            this.setState({selectedQuality: this.state.defaultQuality,
                selectedWeapon: null});
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
        if (typeof(this.state.selectedQuality) === "object") {
            return true;
        } else {
            return false;
        }
    }

    render () {
        var quality;

        if (this.state.isBusy) {
            return <Loading>Weapon data...</Loading>;
        }

        if (this.state.selectedWeapon && this.state.selectedWeapon.quality) {
            quality = <span>{this.state.selectedWeapon.quality.name}</span>;
        } else {
            quality = <DropdownList
                data={this.state.qualityChoices}
                value={this.state.selectedQuality}
                aria-labelledby="cc-weapon-quality-choice"
                textField='name'
                filter="contains"
                onChange={(value) => this.handleQualityChange(value)} />;
        }

        let choices = [];
        if (this.state.weaponTemplateChoices && this.state.weaponChoices) {
            choices = this.state.weaponTemplateChoices.concat(this.state.weaponChoices);
        }
        return <div>
            <Row>
                <Col sm={2}>
                    <label id="cc-weapon-choice">CC Weapon</label>
                </Col>
                <Col sm={4}>
                    <DropdownList data={choices}
                              textField='name'
                              filter="contains"
                              aria-labelledby="cc-weapon-choice"
                              value={this.state.selectedWeapon}
                              groupBy={(obj) => 'base' in obj ? "Existing" : "Template"}
                              onChange={(value) => this.handleWeaponChange(value)} />
                </Col>
            </Row>
            <Row>
                <Col sm={2}>
                    <label id="cc-weapon-quality-choice">CC Weapon Quality</label>
                </Col>
                <Col sm={4}>
                    {quality}
                </Col>
            </Row>
            <Row>
                <Col>
                    <Button size="sm" disabled={!this.fieldsValid()}
                            // ref={(c) => this._addButton = c}
                            onClick={() => this.handleAdd()}>
                        Add CC Weapon</Button>
                </Col>
            </Row>
            <Row>
                <Col><a style={{marginRight: "1em"}}
                        href="/sheets/add_weapon/">Create a new weapon</a>
                    <a style={{marginRight: "1em"}}
                       href="/sheets/add_weapon_template/">Create a new weapon
                        template</a>
                    <a style={{marginRight: "1em"}}
                       href="/sheets/add_weapon_quality/">Create new
                        quality</a>
                    <a style={{marginRight: "1em"}}
                       href="/sheets/add_weapon_special_quality/">Create new
                        special quality</a>

                </Col>
            </Row>
        </div>
    }
}

AddWeaponControl.propTypes = {
    campaign: PropTypes.number.isRequired,
    onAdd: PropTypes.func
};

export default AddWeaponControl;
