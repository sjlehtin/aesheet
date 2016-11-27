import React from 'react';
import ReactDOM from 'react-dom';
import { Button, Modal, Input, ButtonInput } from 'react-bootstrap';
import Octicon from 'react-octicon'

var util = require('sheet-util');
var rest = require('sheet-rest');

class DamageControl extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            currentStamina: this.props.handler.getBaseStats().stamina -
                this.props.character.stamina_damage,
            isBusy: false
        };
    }

    componentWillReceiveProps(props) {
        this.setState({currentStamina: props.handler.getBaseStats().stamina -
            this.props.character.stamina_damage});
    }

    handleSubmit(event) {
        var newValue = this.props.handler.getBaseStats().stamina -
            this.state.currentStamina;
        this.setState({isBusy: true});
        this.props.onMod('stamina_damage', this.props.character.stamina_damage,
            newValue).then(() => this.setState({isBusy: false}));
    }

    handleChange(event) {
        this.setState({currentStamina: event.target.value});
    }

    validationState() {
        return util.isInt(this.state.currentStamina) ? "success" : "error";
    }

    isValid() {
        return this.validationState() == "success";
    }

    handleKeyDown(e) {
        if (e.keyCode === 13) {
            /* Enter. */
            this.handleSubmit();
        }
    }

    render() {
        var inputStyle = {width: "3em"};

        var loading = '';
        if (this.state.isBusy) {
            loading = <Octicon spin name="sync"/>;
        }
        return (<div style={this.props.style}><label>Current stamina:</label>
            <input ref={(c) =>
                     c ? this._inputField = ReactDOM.findDOMNode(c) : null}
                   type="text"
                   onChange={(e) => this.handleChange(e)}
                   //bsStyle={this.validationState()}
                   //hasFeedback
                   value={this.state.currentStamina}
                   onKeyDown={(e) => this.handleKeyDown(e)}
                   style={inputStyle}
            />
            <Button bsSize="xsmall"
                    ref={(c) =>
                      c ? this._changeButton = ReactDOM.findDOMNode(c) : null}
                    disabled={!this.isValid() || this.state.isBusy}
                    onClick={(e) => this.handleSubmit()}>Change{loading}</Button>
        </div>);
    }
}

DamageControl.propTypes = {
    handler: React.PropTypes.object.isRequired,
    onMod: React.PropTypes.func
};

export default DamageControl;
