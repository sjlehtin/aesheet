import React from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';

import Octicon from 'react-octicon'
import {Button, FormControl} from 'react-bootstrap';

const util = require('./sheet-util');
const rest = require('./sheet-rest');

class WoundRow extends React.Component {
    constructor(props) {
        super(props);
        this.state = {editingEffect: false,
            effect: this.props.wound.effect
        };
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

    handleEffectFieldClicked() {
        this.setState({editingEffect: !this.state.editingEffect});
    }

    handleEffectChanged(e) {
        this.setState({effect: e.target.value});
    }

    cancelEdit(e) {
        this.setState({effect: this.props.wound.effect,
                       editingEffect: false});
    }

    handleKeyDown(e) {
        if (e.keyCode === 13) {
            /* Enter. */
            this.props.onMod({id: this.props.wound.id, effect: this.state.effect})
                .then(() => this.setState({editingEffect: false}));
        } else if (e.keyCode === 27) {
            /* Escape. */
            this.cancelEdit();
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

        var effectField = this.props.wound.effect;
        if (this.state.editingEffect) {
            effectField = <FormControl ref={(c) => {if (c) {this._effectInputField = ReactDOM.findDOMNode(c); this._effectInputField.focus(); }}}
                                 type="text"
                                 onChange={(value) => this.handleEffectChanged(value)}
                                 onKeyDown={(e) => this.handleKeyDown(e)}
                                 onClick={(c) => c.stopPropagation()}
                                 value={this.state.effect} />;
        }
        return <tr style={this.props.style}>
            <td>{this.props.wound.location}</td>
            <td>{this.props.wound.damage_type}</td>
            <td>{this.props.wound.damage - this.props.wound.healed}
            <span style={{position: "relative"}}>{worsenButton}{decreaseButton}</span></td>
            <td onClick={() => this.handleEffectFieldClicked()} ref={(c) => this._effectField = c}>
                {effectField}</td>
            <td style={{widht: "3em"}}>
                <Button size="sm"
                        ref={(c) => {if (c) {this._removeButton = ReactDOM.findDOMNode(c)}}}
                        onClick={() => this.handleRemove()}>Heal</Button>
            </td>
        </tr>;
    }
}

WoundRow.propTypes = {
    wound: PropTypes.object.isRequired,
    onMod: PropTypes.func,
    onRemove: PropTypes.func
};

export default WoundRow;
