import React from 'react';
import ReactDOM from 'react-dom';

import {Table, Button, Input} from 'react-bootstrap';

var util = require('sheet-util');
var rest = require('sheet-rest');

import InventoryRow from 'InventoryRow';

/*
 * Inventory component holds the inventory items by itself.  As the items
 * do not have relations other than through their weight, this works ok.
 * If need be, the inventory can also be pushed up as state for the
 * StatBlock or a separate control.
 */
class Inventory extends React.Component {

    constructor(props) {
        super(props);

        this.state = {inventory: [], addEnabled: false,
        addButtonEnabled: true};
    }

    componentDidMount() {
        rest.getData(this.props.url).then((json) => {
            this.updateInventory(json);
        });
    }

    notifyWeightChange() {
        if (typeof(this.props.onWeightChange) !== "undefined") {
            this.props.onWeightChange(this.totalWeight());
        }
    }

    updateInventory(newInventory) {
        this.setState({inventory: newInventory});
        this.notifyWeightChange();
    }

    totalWeight() {
        var total = 0;
        this.state.inventory.forEach((elem, ii) => {
            total += parseFloat(elem.unit_weight)
                * parseInt(elem.quantity);
        });
        return total;
    }

    handleAddButtonClick(e) {
        e.preventDefault();
        this.setState({addEnabled: true})
    }

    handleNew(newElem) {
        var newInventory = this.state.inventory;
        var data = newElem;
        data.order = this.state.inventory.length + 1;

        rest.post(this.props.url, data)
            .then((json) => {
                console.log("Add successful:", json);
                /* The returned id will be used as the key, and can also
                   be used to immediately update or delete the new item. */
                data.id = json.id;

                newInventory.push(data);

                this.setState({addEnabled: false});
                this.setState({addButtonEnabled: true});
                this.updateInventory(newInventory);
            })
            .catch((err) => {console.log("Failed to update: ", err); });
    }

    handleRemove(idx) {
        var elem = this.state.inventory[idx];
        rest.delete(`${this.props.url}${elem.id}/`,
            this.state.inventory[idx])
            .then((json) => {
                var removed = this.state.inventory.splice(idx, 1);
                console.log("removed:", idx, removed);
                console.log("new inventory:", this.state.inventory);
                this.updateInventory(this.state.inventory);
            })
            .catch((err) => {console.log("Failed to update: ", err); })
    }

    handleEdit(idx, newElem) {
        console.log(`Updated ${idx}:`, newElem);
        var newInventory = this.state.inventory;
        newInventory[idx] = newElem;

        rest.put(`${this.props.url}${newElem.id}/`,
            newElem)
            .then((json) => {
                this.updateInventory(newInventory);
            })
            .catch((err) => {console.log("Failed to update: ", err); });
    }

    handleInputRowChanged() {
        console.log("Changed ", this._inputRow.isValid());
        this.setState({addButtonEnabled: this._inputRow.isValid()});
    }

    handleAddButtonClick() {
        if (!this.state.addEnabled) {
            this.setState({addEnabled: true});
            this.setState({addButtonEnabled: false});
        } else {
            if (this._inputRow.isValid()) {
                this._inputRow.submit();
            }
        }
    }

    render() {
        var total = 0;
        var weightStyle = {textAlign: "left", paddingLeft: 20};
        var rows = this.state.inventory.map((elem, ii) => {
            total += parseFloat(elem.unit_weight)
                * parseInt(elem.quantity);
            return <InventoryRow key={elem.id} initialEntry={elem}
                                 onDelete={() => this.handleRemove(ii)}
                                 onMod={(newElem) =>
                                   this.handleEdit(ii, newElem)} />;
        });

        if (this.state.addEnabled) {
            rows.push(<InventoryRow
                ref={(c) => this._inputRow = c}
                key={-1}
                createNew={true}
                onMod={(newElem) => this.handleNew(newElem)}
                onChange={() => this.handleInputRowChanged()}>
                <Button onClick={() => this.setState({addEnabled: false})}
                >Cancel</Button>
            </InventoryRow>);
        }
        return <Table striped condensed style={{fontSize: "80%"}}>
            <thead>
            <tr><th>Item</th><th>Location</th><th>Qty</th><th>Wt.</th><th style={weightStyle}>Total Wt.</th></tr>
            </thead>
            <tbody>
            {rows}
            </tbody>
            <tfoot>
            <tr>
                <td><Button
                    ref={(c) => {this._addButton =
                    c ? ReactDOM.findDOMNode(c) : undefined}}
                    style={{}}
                    disabled={!this.state.addButtonEnabled}
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
    url: React.PropTypes.string.isRequired,
    onWeightChange: React.PropTypes.func
};

export default Inventory;
