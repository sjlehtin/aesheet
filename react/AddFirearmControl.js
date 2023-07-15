import React from 'react';
import PropTypes from 'prop-types';

import {Grid, Col, Row, Label, Button} from 'react-bootstrap';

import DropdownList from 'react-widgets/DropdownList';

var rest = require('./sheet-rest');

class AddFirearmControl extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            isBusy: false,
            isOpen: false
        }
    }

    loadFirearms() {
        this.setState({isBusy: true});
        rest.getData(`/rest/firearms/campaign/${this.props.campaign}/`).then(
            (json) => {
                this.setState({
                    firearmChoices: json,
                    isBusy: false})
            }
        ).catch((err) => console.log(err));
    }

    handleFirearmChange(value) {
        this.setState({selectedFirearm: value});
        if (!this.state.firearmChoices) {
            this.loadFirearms();
        }

        this.setState({selectedAmmo: null});

        if (typeof(value) === "object") {

            rest.getData(`/rest/ammunition/firearm/${encodeURIComponent(value.name)}/`).then(
                (json) => {
                    this.setState({ammoChoices: json})
                }
            ).catch((err) => console.log(err));
        }
    }

    handleAmmoChange(value) {
        this.setState({selectedAmmo: value})
    }

    handleOpen() {
        this.loadFirearms();
    }

    handleAdd() {
        console.log("adding:",
            this.state.selectedFirearm, this.state.selectedAmmo);
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
                    <label>Firearm</label>
                </Col>
                <Col sm={4}>
                    <DropdownList data={this.state.firearmChoices}
                                  textField='name'
                                  open={this.state.isOpen}
                                  busy={this.state.isBusy}
                                  onToggle={(isOpen) => {
                                      this.setState({isOpen: isOpen});
                                      if (isOpen) {
                                          this.handleOpen();
                                      }
                                  }}
                                  filter="contains"
                                  value={this.state.selectedFirearm}
                                  onChange={(value) => this.handleFirearmChange(value)}
                    />
                </Col>
            </Row>
            <Row>
                <Col sm={2}>
                    <label>Ammo</label>
                </Col>
                <Col sm={4}>
                    <DropdownList data={this.state.ammoChoices}
                                  value={this.state.selectedAmmo}
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
                            ref={(c) => this._addButton = c}
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
