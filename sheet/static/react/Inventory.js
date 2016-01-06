import React from 'react';
import ReactDOM from 'react-dom';

import {Table, Button, Input} from 'react-bootstrap';

var util = require('sheet-util');
var rest = require('sheet-rest');

import InventoryRow from 'InventoryRow';

class Inventory extends React.Component {

    constructor(props) {
        super(props);

        this.state = {inventory: [], addEnabled: false };
    }

    componentDidMount() {
        rest.getData(this.props.url).then((json) => {
            this.setState({inventory: json});
        });
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

                this.setState({inventory: newInventory, addEnabled: false});
            })
            .catch((err) => {console.log("Failed to update: ", err); });
    }

    handleRemove(idx) {
        var elem = this.state.inventory[idx];
        rest.delete(`${this.props.url}${elem.id}/`,
            this.state.inventory[idx])
            .then((json) => { console.log(json);
                var removed = this.state.inventory.splice(idx, 1);
                console.log("removed:", idx, removed, this.state.inventory);
                this.setState({inventory: this.state.inventory});
            })
            .catch((err) => {console.log("Failed to update: ", err); })
    }

    handleEdit(idx, newElem) {
        console.log("Updated", idx, newElem);
        var newInventory = this.state.inventory;
        newInventory[idx] = newElem;

        rest.put(`${this.props.url}${newElem.id}/`,
            newElem)
            .then((json) => {
                this.setState({inventory: newInventory}) })
            .catch((err) => {console.log("Failed to update: ", err); });

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
            rows.push(<InventoryRow key={-1} createNew={true} onMod={(newElem) => this.handleNew(newElem)} />);
        }
        return <Table striped condensed hover style={{fontSize: "80%"}}>
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
