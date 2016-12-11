import React from 'react';
import ReactDOM from 'react-dom';
import Octicon from 'react-octicon'
import {Button} from 'react-bootstrap';

var util = require('sheet-util');
var rest = require('sheet-rest');

class WoundRow extends React.Component {
    constructor(props) {
        super(props);
    }

    handleWorsen() {
        if (this.props.onMod) {
            this.props.onMod({id: this.props.wound.id,
                damage: this.props.wound.damage + 1});
        }
    }

    handleHeal() {
        if (this.props.onMod) {
            this.props.onMod({id: this.props.wound.id,
                healed: this.props.wound.healed + 1});
        }
    }

    handleRemove() {
        if (this.props.onRemove) {
            this.props.onRemove({id: this.props.wound.id});
        }
    }

    render() {

        var worsenButton, decreaseButton = '';

        worsenButton = <span style={{color: "red", position: "absolute", left: 10, bottom: 1, cursor: "pointer"}}
                               ref={(c) => this._worsenButton = c}
                               onClick={() => this.handleWorsen()}>
            <Octicon name="arrow-up" /></span>;

        if (this.props.wound.healed < this.props.wound.damage) {
            decreaseButton = <span style={{
                color: "green",
                position: "absolute",
                left: 22,
                bottom: -3,
                cursor: "pointer"
            }}
                                   ref={(c) => this._healButton = c}
                                   onClick={() => this.handleHeal()}>
            <Octicon name="arrow-down"/></span>;
        }

        return <tr style={this.props.style}>
            <td>{this.props.wound.location}</td>
            <td>{this.props.wound.damage - this.props.wound.healed}
            <span style={{position: "relative"}}>{worsenButton}{decreaseButton}</span></td>
            <td>{this.props.wound.effect}
                <Button bsSize="xsmall"
                        ref={(c) => {if (c) {this._removeButton = ReactDOM.findDOMNode(c)}}}
                        onClick={() => this.handleRemove()}>Heal</Button>
            </td>
        </tr>;
    }
}

WoundRow.propTypes = {
    wound: React.PropTypes.object.isRequired,
    onMod: React.PropTypes.func,
    onRemove: React.PropTypes.func
};

export default WoundRow;
