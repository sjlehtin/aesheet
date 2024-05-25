import React from 'react';
import PropTypes from 'prop-types';

import {Grid, Col, Row, Label, Button} from 'react-bootstrap';

import DropdownList from 'react-widgets/DropdownList';

var rest = require('./sheet-rest');

class AddFirearmControl extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            isBusy: true,
        }
    }

    async componentDidMount() {
        await this.loadFirearms()
    }

    async loadFirearms() {
        this.setState({isBusy: true});
        const json = await rest.getData(`/rest/firearms/campaign/${this.props.campaign}/`)
        this.setState(
            {
                    firearmChoices: json,
                    isBusy: false
            }
        )
    }

    async handleFirearmChange(value) {
        this.setState({selectedFirearm: value});
        if (!this.state.firearmChoices) {
            await this.loadFirearms();
        }

        this.setState({selectedAmmo: null, isBusy: true});

        if (typeof(value) === "object") {

            const json = await rest.getData(`/rest/ammunition/firearm/${encodeURIComponent(value.name)}/`)
            this.setState({ammoChoices: json, isBusy: false})
        }
    }

    handleAmmoChange(value) {
        this.setState({selectedAmmo: value})
    }

    handleAdd() {
        if (this.props.onFirearmAdd) {
            this.props.onFirearmAdd({
                base: this.state.selectedFirearm,
                ammo: this.state.selectedAmmo
            });

            this.setState({selectedFirearm: null, selectedAmmo: null});
        }
    }

    fieldsValid() {
        if (!this.state.selectedFirearm) {
            return false;
        }
        if (typeof(this.state.selectedFirearm) !== "object") {
            return false;
        }
        return typeof(this.state.selectedAmmo) === "object";
    }

    static formatAmmo(ammo) {
        if (!ammo) {
            return '';
        }
        if (typeof(ammo) !== "object") {
            return ammo;
        }
        const impulse = parseFloat(ammo.weight) * ammo.velocity / 1000;
        return `${ammo.calibre.name} ${ammo.bullet_type} (${impulse.toFixed(2)})`;
    }

    render () {
        return <div>
            <Row>
                <Col sm={2}>
                    <label id={"firearm-label"}>Firearm</label>
                </Col>
                <Col sm={4}>
                    <DropdownList data={this.state.firearmChoices}
                                  textField='name'
                                  aria-labelledby={"firearm-label"}
                                  busy={this.state.isBusy}
                                  filter="contains"
                                  value={this.state.selectedFirearm}
                                  onChange={async (value) => await this.handleFirearmChange(value)}
                    />
                </Col>
            </Row>
            <Row>
                <Col sm={2}>
                    <label id={"ammunition-label"}>Ammo</label>
                </Col>
                <Col sm={4}>
                    <DropdownList data={this.state.ammoChoices}
                                  value={this.state.selectedAmmo}
                                  busy={this.state.isBusy}
                                  aria-labelledby={"ammunition-label"}
                                  textField={(obj) => {
                                      return AddFirearmControl.formatAmmo(obj);
                                  }}
                                  onChange={
                                      (value) => this.handleAmmoChange(value)}/>
                </Col>
            </Row>
            <Row>
                <Col>
                    <Button size="sm" disabled={!this.fieldsValid()}
                            onClick={() => this.handleAdd()}>
                        Add Firearm</Button>
                </Col>
            </Row>
            <Row>
                <Col>
                    <div><a href="/sheets/add_firearm/">Create a new
                        firearm</a>
                        <a href="/sheets/add_ammunition/">Create new ammo</a>
                    </div>
                </Col>
            </Row>
        </div>
    }
}

AddFirearmControl.propTypes = {
    campaign: PropTypes.number.isRequired,
    onFirearmAdd: PropTypes.func
};

export default AddFirearmControl;
