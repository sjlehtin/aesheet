import React from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';

import {Table, Button, Input} from 'react-bootstrap';

const util = require('./sheet-util');
const rest = require('./sheet-rest');

import Loading from 'Loading'
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
        addButtonEnabled: true,
        loading: true};
    }

    escFunction(event) {
        if (event.key === "Escape") {
            this.setState({addEnabled: false, addButtonEnabled: true})
        }
    }

    componentWillUnmount() {
        document.removeEventListener("keydown", this.escFunction, false);
    }

    async componentDidMount() {
        const json = await rest.getData(this.props.url)
        await this.updateInventory(json)
        await this.setState({loading: false})
        document.addEventListener("keydown", (e) => this.escFunction(e), false);
    }

    async notifyWeightChange(newInventory) {
        if (typeof(this.props.onWeightChange) !== "undefined") {
            await this.props.onWeightChange(this.totalWeight(newInventory));
        }
    }

    async updateInventory(newInventory) {
        await this.setState({inventory: newInventory});
        await this.notifyWeightChange(newInventory);
    }

    totalWeight(inventory) {
        var total = 0;
        inventory.forEach((elem, ii) => {
            total += parseFloat(elem.unit_weight)
                * parseInt(elem.quantity);
        });
        return total;
    }

    handleNew(newElem) {
        var newInventory = this.state.inventory;
        var data = newElem;
        data.order = this.state.inventory.length + 1;

        rest.post(this.props.url, data)
            .then((json) => {
                /* The returned id will be used as the key, and can also
                   be used to immediately update or delete the new item. */
                data.id = json.id;

                newInventory.push(data);

                this.setState({
                    addEnabled: false,
                    addButtonEnabled: true
                });
                this.updateInventory(newInventory);
            })
            .catch((err) => {console.log("Failed to update: ", err); });
    }

    handleRemove(idx) {
        const elem = this.state.inventory[idx];
        rest.del(`${this.props.url}${elem.id}/`,
            this.state.inventory[idx])
            .then((json) => {
                this.state.inventory.splice(idx, 1);
                this.updateInventory(this.state.inventory);
            })
            .catch((err) => {console.log("Failed to update: ", err); })
    }

    handleEdit(idx, newElem) {
        const newInventory = this.state.inventory;
        newInventory[idx] = newElem;

        rest.put(`${this.props.url}${newElem.id}/`,
            newElem)
            .then((json) => {
                this.updateInventory(newInventory);
            })
            .catch((err) => {console.log("Failed to update: ", err); });
    }

    handleInputRowChanged() {
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
        let loading = ""
        if (this.state.loading) {
            loading = <Loading>Inventory</Loading>
        }

        let total = 0;
        const weightStyle = {textAlign: "left", paddingLeft: 20};

        const rows = this.state.inventory.map((elem, ii) => {
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
                <Button id={"cancelButton"}
                        onClick={() => this.setState({addEnabled: false, addButtonEnabled: true})}>Cancel</Button>
            </InventoryRow>);
        }
        return <Table striped condensed={"true"} style={{fontSize: "80%"}}>
            <thead>
            <tr><th>{loading}Item</th><th>Location</th><th>Qty</th><th>Wt.</th><th style={weightStyle}>Total Wt.</th></tr>
            </thead>
            <tbody>
            {rows}
            </tbody>
            <tfoot>
            <tr>
                <td><Button
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
    url: PropTypes.string.isRequired,
    onWeightChange: PropTypes.func
};

export default Inventory;
