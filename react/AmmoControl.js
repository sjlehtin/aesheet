import React from 'react';

import {Button, Col, Row} from 'react-bootstrap';
import DropdownList from 'react-widgets/lib/DropdownList';
import AddFirearmControl from './AddFirearmControl';

const rest = require('./sheet-rest');

class AmmoControl extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            busy: false,
            editing: false,
            open: true,
            ammoChoices: [],
            selectedAmmo: undefined
        };
    }

    updateAmmoSelection() {
        return rest.getData(this.props.url).then(json => {
            let selectedAmmo = json.find((el) => {return this.props.ammo.id === el.id});

            this.setState({busy: false, ammoChoices: json,
                           selectedAmmo: selectedAmmo});
        });
    }

    handleChangeClick() {
        this.setState({busy: true, editing: true});

        this.updateAmmoSelection();
    }

    cancelEdit() {
        this.setState({editing: false,
                       selectedAmmo: undefined});
    }

    handleKeyDown(e) {
        if (e.keyCode === 27) {
            /* Escape. */
            this.cancelEdit();
        }
    }

    handleChange(value) {
        this.setState({selectedAmmo: value});
    }

    handleSubmit() {
        if (this.props.onChange) {
            this.props.onChange(this.state.selectedAmmo)
                .then(() => this.cancelEdit());
        }
    }

    render() {
        let content;
        if (this.state.editing) {
            content = <Row>
                <Col>
            <Button onClick={(e) => {e.stopPropagation(); this.handleSubmit()}}
                                ref={(c) => this._submitButton = c}
                                bsSize="xsmall">Set</Button>
                </Col>
                <Col>
                <DropdownList
                                open={this.state.open}
                                value={this.state.selectedAmmo}
                                busy={this.state.busy}
                                textField={(obj) => {return AddFirearmControl.formatAmmo(obj);}}
                                onChange={(value) => this.handleChange(value)}
                                onToggle={() => this.setState({open: !this.state.open})}
                                filter="contains"
                                data={this.state.ammoChoices}

                /></Col>
            </Row>;
        } else {
            content = <div><span>{this.props.ammo.label} {this.props.ammo.bullet_type}</span>
            <Button onClick={(e) => this.handleChangeClick()}
                                ref={(c) => this._changeButton = c}
                                bsSize="xsmall">Change</Button>
            </div>;
        }
        return <div onKeyDown={this.handleKeyDown.bind(this)}>
            {content}
        </div>;
    }
}

AmmoControl.props = {
    ammo: React.PropTypes.object.isRequired,
    url: React.PropTypes.string,
    onChange: React.PropTypes.func
};

export {AmmoControl};
export default AmmoControl;
