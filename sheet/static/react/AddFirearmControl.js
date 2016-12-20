import React from 'react';
import ReactDOM from 'react-dom';

import {Grid, Col, Row, Label, Button} from 'react-bootstrap';

import Combobox from 'react-widgets/lib/Combobox';

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

            rest.getData(`/rest/ammunition/firearm/${value.name}/`).then(
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
        if (typeof(this.state.selectedAmmo) === "object") {
            return true;
        } else {
            return false;
        }
    }

    formatAmmo(ammo) {
        if (!ammo) {
            return '';
        }
        if (typeof(ammo) !== "object") {
            return ammo;
        }
        var impulse = parseFloat(ammo.weight) * ammo.velocity / 1000;
        return `${ammo.label} ${ammo.bullet_type} (${impulse.toFixed(2)})`;
    }

    render () {
        return <div>
            <Row>
            <table>
                <tbody>
                <tr>
                    <td><label>Firearm</label></td>
                    <td><Combobox data={this.state.firearmChoices}
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
                                  onChange={(value) => this.handleFirearmChange(value) }
                /></td>
                </tr>
                <tr>
                    <td><label>Ammo</label></td>
                    <td>
                        <Combobox data={this.state.ammoChoices}
                                  value={this.state.selectedAmmo}
                                  textField={(obj) => {return this.formatAmmo(obj);}}
                                  onChange={
                                  (value) => this.handleAmmoChange(value)} />
                    </td>
                </tr>
                </tbody>
            </table>
            <Button bsSize="small" disabled={!this.fieldsValid()}
                    ref={(c) => this._addButton = c}
                    onClick={() => this.handleAdd()}>
                Add Firearm</Button>
                <div><a href="/sheets/add_firearm/">Create a new firearm</a>
                    <a href="/sheets/add_ammunition/">Create new ammo</a>
                </div>
            </Row>
        </div>
    }
}

AddFirearmControl.propTypes = {
    campaign: React.PropTypes.number.isRequired,
    onFirearmAdd: React.PropTypes.func
};

export default AddFirearmControl;
