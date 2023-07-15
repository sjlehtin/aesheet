import React from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';

import {Button, FormControl, FormGroup} from 'react-bootstrap';

/* Handling reordering, additions... perhaps most convenient to signal
   updates towards parent.

    But, maybe not.  Let's see.  If the updates/modifications are
     performed by this component, how will the reorderings be handled?
*/

const util = require('./sheet-util');

class InventoryRow extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            description: "",
            unitWeight: "1.0",
            location: "",
            quantity: "1",
            editing: false
        };
        if (this.props.initialEntry) {
            this.state = Object.assign(this.state, {
                old: {},
                description: this.props.initialEntry.description,
                unitWeight: this.props.initialEntry.unit_weight,
                location: this.props.initialEntry.location,
                quantity: this.props.initialEntry.quantity
            })
        }

        if (this.props.createNew) {
            this.state.editing = true
        }
    }

    startEdit(field) {
        this.setState({editing: true,
            old: {
                description: this.state.description,
                unitWeight: this.state.unitWeight,
                location: this.state.location,
                quantity: this.state.quantity
            }
        });
    }

    cancelEdit = () => {
        this.setState(Object.assign(this.state, this.state.old, {editing: false}));
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
        return util.isFloat(this.state.unitWeight);
    }

    quantityValidationState() {
        return util.isInt(this.state.quantity);
    }

    descriptionValidationState() {
        return this.state.description.length > 0;
    }

    isValid() {
        return this.descriptionValidationState() &&
            this.quantityValidationState() &&
            this.unitWeightValidationState();
    }

    submit() {
        if (!this.isValid()) {
            return;
        }

        if (this.props.onMod) {
            let initial;
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
            ))
        }

        this.setState({editing: false})
    }

    handleKeyDown(e, field) {

        if (e.key === "Enter") {
            this.submit();
            e.stopPropagation()
        } else if (e.key === "Escape") {

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

        if (this.state.editing) {
            description = <FormGroup>
                <FormControl type="text"
                           ref={(c) => { this._descriptionInputField = c ?
                           ReactDOM.findDOMNode(c) : undefined}}
                           isValid={this.descriptionValidationState()}
                           onChange={(e) => this.handleDescriptionChange(e)}
                           onKeyDown={(e) =>
                             this.handleKeyDown(e, "description")}
                           aria-label={"description"}
                           value={this.state.description}
                autoFocus />
                <FormControl.Feedback />
            </FormGroup>;
        } else {
            description = this.state.description;
        }

        if (this.state.editing) {
            quantity = <FormControl type="text"
                           ref={(c) => { this._quantityInputField = c ?
                           ReactDOM.findDOMNode(c) : undefined}}
                           isValid={this.quantityValidationState()}
                           onChange={(e) => this.handleQuantityChange(e)}
                           onKeyDown={(e) =>
                             this.handleKeyDown(e, "quantity")}
                           aria-label={"quantity"}

                           value={this.state.quantity} />;
        } else {
            quantity = this.state.quantity;
        }

        if (this.state.editing) {
            location = <FormControl type="text"
                           ref={(c) => { this._locationInputField = c ?
                           ReactDOM.findDOMNode(c) : undefined}}
                           onChange={(e) => this.handleLocationChange(e)}
                                    isValid={true}
                           onKeyDown={(e) =>
                             this.handleKeyDown(e, "location")}
                           aria-label={"location"}
                           value={this.state.location} />;
        } else {
            location = this.state.location;
        }
        
        if (this.state.editing) {
            unitWeight = <FormControl type="text"
                           ref={(c) => { this._unitWeightInputField = c ?
                           ReactDOM.findDOMNode(c) : undefined}}
                           isValid={this.unitWeightValidationState()}
                           onChange={(e) => this.handleUnitWeightChange(e)}
                           onKeyDown={(e) =>
                             this.handleKeyDown(e, "unitWeight")}
                                      aria-label={"weight"}
                           value={this.state.unitWeight} />;
        } else {
            unitWeight = this.state.unitWeight;
        }

        var removeButton;
        if (!this.props.createNew) {
            removeButton =
                <Button
                    ref={(c) => {if (c) {this._removeButton = ReactDOM.findDOMNode(c)}}}
                    size="sm"
                    onClick={(e) => {this.handleRemove(e); }}>
                    Remove</Button>;
        } else {
            removeButton = '';
        }

        return (<tr onKeyDown={(e) =>
                             this.handleKeyDown(e, "foo")}>
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

            <td className="weight" aria-label={"Weight"}>{ (parseFloat(this.state.unitWeight) * parseInt(this.state.quantity)).toFixed(2) }</td>
        </tr>);
    }
}

InventoryRow.propTypes = {
    onDelete: PropTypes.func,
    onMod: PropTypes.func,
    onChange: PropTypes.func,
    initialEntry: PropTypes.object,
    createNew: PropTypes.bool
};

InventoryRow.defaultProps = { createNew: false };

export default InventoryRow;
