import React from 'react';
import ReactDOM from 'react-dom';

import {Table, Button, Input} from 'react-bootstrap';

var rest = require('sheet-rest');

class Inventory extends React.Component {
    constructor(props) {
        super(props);
        this.state = {addEnabled: false,
            inventory: [],
            newDescription: '',
            newLocation: '',
            newUnitWeight: 1.0,
            newQuantity: 1
        };
    }

    componentDidMount() {
        var parseJSON = function (json) {
            return json.map((elem) => { var parsed = Object.assign({}, elem);
                parsed.unit_weight = parseFloat(parsed.unit_weight);
                return parsed;
            })
        };
        rest.getData(this.props.url).then((json) => {
            this.setState({inventory: parseJSON(json)});
        });
    }

    handleAddButtonClick(e) {
        e.preventDefault();
        this.setState({addEnabled: true})
    }

    handleDescriptionChange(e) {
        e.preventDefault();
        this.setState({newDescription: e.target.value})
    }

    handleLocationChange(e) {
        e.preventDefault();
        this.setState({newLocation: e.target.value})
    }

    handleQuantityChange(e) {
        e.preventDefault();
        this.setState({newQuantity: e.target.value})
    }

    handleUnitWeightChange(e) {
        e.preventDefault();
        this.setState({newUnitWeight: e.target.value})
    }

    submit() {
        var newInventory = this.state.inventory;
        var data = {
            description: this.state.newDescription,
            location: this.state.newLocation,
            unit_weight: this.state.newUnitWeight,
            quantity: this.state.newQuantity,
            order: this.state.inventory.length + 1
        };

        newInventory.push(data);
        rest.post(this.props.url,
            data)
            .then((json) => { console.log(json);
                this.setState({inventory: newInventory}) })
            .catch((err) => {console.log("Failed to update: ", err); })
    }

    handleKeyDown(e) {
        if (e.keyCode === 13) {
            this.submit();
        }
    }

    render() {
        var total = 0;
        var weightStyle = {textAlign: "left", paddingLeft: 20};
        var rows = this.state.inventory.map((elem, ii) => {
            var rowTotal = elem.unit_weight * elem.quantity;
            total += rowTotal;
            return <tr key={ii}><td>{elem.description}</td>
            <td>{elem.location}</td>
            <td>{elem.quantity}</td>
                <td>{elem.unit_weight}</td>
                <td className="weight" style={weightStyle}>{rowTotal}</td></tr>;
        });

        var inputRow;
        if (this.state.addEnabled) {
            inputRow = <tr>
                <td><Input type="text"
                           ref={(c) => {
                       this._descriptionInputField = c ?
                       c.getInputDOMNode() : undefined }}
                           onChange={(e) => this.handleDescriptionChange(e)}
                           onKeyDown={(e) => this.handleKeyDown(e)}
                           value={this.state.newDescription} /></td>
                <td><Input type="text"
                       ref={(c) => {
                       this._locationInputField = c ?
                       c.getInputDOMNode() : undefined }}
                       onChange={(e) => this.handleLocationChange(e)}
                           onKeyDown={(e) => this.handleKeyDown(e)}
                           value={this.state.newLocation} /></td>
                <td><Input type="text"
                       ref={(c) => {
                       this._quantityInputField = c ?
                       c.getInputDOMNode() : undefined }}
                       onChange={(e) => this.handleQuantityChange(e)}
                           onKeyDown={(e) => this.handleKeyDown(e)}

                       value={this.state.newQuantity} /></td>
                <td><Input type="text"
                       ref={(c) => {
                       this._unitWeightInputField = c ?
                       c.getInputDOMNode() : undefined }}
                       onChange={(e) => this.handleUnitWeightChange(e)}
                           onKeyDown={(e) => this.handleKeyDown(e)}

                       value={this.state.newUnitWeight} /></td>
                <td></td>
            </tr>
        }
        return <Table striped condensed hover style={{fontSize: "80%"}}>
            <thead>
            <tr><th>Item</th><th>Location</th><th>Qty</th><th>Wt.</th><th style={weightStyle}>Total Wt.</th></tr>
            </thead>
            <tbody>
            {rows}
            {inputRow}
            </tbody>
            <tfoot>
            <tr>
                <td><Button
                    ref={(c) => {this._addButton =
                    c ? ReactDOM.findDOMNode(c) : undefined}}
                    style={{}}
                    onClick={(e) => this.handleAddButtonClick(e)}>
                    Add entry</Button></td>
                <td colSpan="3" style={{
            fontWeight: "bold", textAlign: "right"}}>
                Total weight</td>
                <td style={weightStyle}>{total}</td></tr>
            </tfoot>
        </Table>;
    }
}

Inventory.propTypes = {
    url: React.PropTypes.string.isRequired
};

export default Inventory;
