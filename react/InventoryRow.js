import React from 'react';
import ReactDOM from 'react-dom';

import {Button, Input} from 'react-bootstrap';

/* Handling reordering, additions... perhaps most convenient to signal
   updates towards parent.

    But, maybe not.  Let's see.  If the updates/modifications are
     performed by this component, how will the reorderings be handled?
*/

var util = require('./sheet-util');

class InventoryRow extends React.Component {
    constructor(props) {
        super(props);

        var initial = {
            description: "",
            unitWeight: "1.0",
            location: "",
            quantity: "1"
        };

        if (this.props.initialEntry) {
            initial = {
                old: {},
                description: this.props.initialEntry.description,
                unitWeight: this.props.initialEntry.unit_weight,
                location: this.props.initialEntry.location,
                quantity: this.props.initialEntry.quantity
            }
        }
        var edits;

        if (this.props.createNew) {
            edits = {showDescriptionEdit: true,
            showLocationEdit: true,
            showQuantityEdit: true,
            showUnitWeightEdit: true};
            edits.show = {description: true,
                location: true,
                quantity: true,
                unitWeight: true
            }
        } else {
            edits = {showDescriptionEdit: false,
            showLocationEdit: false,
            showQuantityEdit: false,
            showUnitWeightEdit: false};
            edits.show = {description: false,
            location: false,
            quantity: false,
            unitWeight: false}
        }
        this.state = Object.assign(edits, initial);
    }

    startEdit(field) {
        var update = {};
        update.show = Object.assign({}, this.state.show);
        update.old = Object.assign({}, this.state.old);
        update.show[field] = true;
        update.old[field] = this.state[field]
        this.setState({show: update.show,
            old: update.old
        });
    }

    cancelEdit(field) {
        var update = {};
        update[field] = this.state.old[field];
        this.state.show[field] = false;
        this.setState(Object.assign(update, {show: this.state.show}));
    }

    handleChange(e) {
        if (this.props.onChange) {
            this.props.onChange();
        }
    }

    handleDescriptionChange(e) {
        this.setState({description: e.target.value},
            () => this.handleChange(e));
    }

    handleLocationChange(e) {
        this.setState({location: e.target.value},
            () => this.handleChange(e));
    }

    handleQuantityChange(e) {
        this.setState({quantity: e.target.value},
            () => this.handleChange(e));
    }

    handleUnitWeightChange(e) {
        this.setState({unitWeight: e.target.value},
            () => this.handleChange(e));
    }

    unitWeightValidationState() {
        return util.isFloat(this.state.unitWeight) ? "success" : "error";
    }

    quantityValidationState() {
        return util.isInt(this.state.quantity) ? "success" : "error";
    }

    descriptionValidationState() {
        return this.state.description.length > 0 ? "success" : "error";
    }

    isValid() {
        if (this.descriptionValidationState() != "success") {
            return false;
        }

        if (this.quantityValidationState() != "success") {
            return false;
        }

        if (this.unitWeightValidationState() != "success") {
            return false;
        }

        return true;
    }

    submit() {
        if (!this.isValid()) {
            return;
        }

        if (this.props.onMod) {
            var initial;
            if (!this.props.initialEntry) {
                initial = {};
            } else {
                initial = Object.assign({}, this.props.initialEntry);
            }
            this.props.onMod(Object.assign(initial,
                { description: this.state.description,
                    unit_weight: this.state.unitWeight,
                    location: this.state.location,
                    quantity: this.state.quantity
                }
            ));
        }

        this.setState({show: {description: false, location: false,
            unitWeight: false, quantity: false}});
    }

    handleKeyDown(e, field) {
        if (e.keyCode === 13) {
            /* Enter. */
            this.submit();
        } else if (e.keyCode === 27) {
            /* Escape. */
            this.cancelEdit(field);
        }
    }

    handleRemove(event) {
        event.stopPropagation();
        if (typeof(this.props.onDelete) !== "undefined") {
            this.props.onDelete();
        }
    }

    render () {
        var description, unitWeight, quantity, location;

        if (this.state.show.description) {
            description = <Input type="text"
                           ref={(c) => { this._descriptionInputField = c ?
                           c.getInputDOMNode() : undefined}}
                           bsStyle={this.descriptionValidationState()}
                           hasFeedback
                           onChange={(e) => this.handleDescriptionChange(e)}
                           onKeyDown={(e) =>
                             this.handleKeyDown(e, "description")}
                           value={this.state.description} />;
        } else {
            description = this.state.description;
        }

        if (this.state.show.quantity) {
            quantity = <Input type="text"
                           ref={(c) => { this._quantityInputField = c ?
                           c.getInputDOMNode() : undefined}}
                           bsStyle={this.quantityValidationState()}
                           hasFeedback
                           onChange={(e) => this.handleQuantityChange(e)}
                           onKeyDown={(e) =>
                             this.handleKeyDown(e, "quantity")}
                           value={this.state.quantity} />;
        } else {
            quantity = this.state.quantity;
        }

        if (this.state.show.location) {
            location = <Input type="text"
                           ref={(c) => { this._locationInputField = c ?
                           c.getInputDOMNode() : undefined}}
                           onChange={(e) => this.handleLocationChange(e)}
                           onKeyDown={(e) =>
                             this.handleKeyDown(e, "location")}
                           value={this.state.location} />;
        } else {
            location = this.state.location;
        }
        
        if (this.state.show.unitWeight) {
            unitWeight = <Input type="text"
                           ref={(c) => { this._unitWeightInputField = c ?
                           c.getInputDOMNode() : undefined}}
                           bsStyle={this.unitWeightValidationState()}
                           hasFeedback
                           onChange={(e) => this.handleUnitWeightChange(e)}
                           onKeyDown={(e) =>
                             this.handleKeyDown(e, "unitWeight")}
                           value={this.state.unitWeight} />;
        } else {
            unitWeight = this.state.unitWeight;
        }

        var removeButton;
        if (!this.props.createNew) {
            removeButton =
                <Button
                    ref={(c) => {if (c) {this._removeButton = ReactDOM.findDOMNode(c)}}}
                    bsSize="xsmall"
                    onClick={(e) => {this.handleRemove(e); }}>
                    Remove</Button>;
        } else {
            removeButton = '';
        }
        return (<tr>
            <td style={{position: "relative"}} ref={(c) => this._descriptionField = c}
                onClick={(e) => this.startEdit("description")}>
                <span>
                {description}
                {this.props.children}
                </span>
                <span style={{float: "right"}}>
                {removeButton}
                </span>
            </td>

            <td ref={(c) => this._locationField = c}
                onClick={(e) => this.startEdit("location")}>
                {location}</td>

            <td ref={(c) => this._quantityField = c}
                onClick={(e) => this.startEdit("quantity")}>
                {quantity}</td>

            <td ref={(c) => this._unitWeightField = c}
                onClick={(e) => this.startEdit("unitWeight")}>
                {unitWeight}</td>

            <td className="weight">{ parseFloat(this.state.unitWeight) * parseInt(this.state.quantity) }</td>
        </tr>);
    }
}

InventoryRow.propTypes = {
    onDelete: React.PropTypes.func,
    onMod: React.PropTypes.func,
    onChange: React.PropTypes.func,
    initialEntry: React.PropTypes.object,
    createNew: React.PropTypes.bool
};

InventoryRow.defaultProps = { createNew: false };

export default InventoryRow;
