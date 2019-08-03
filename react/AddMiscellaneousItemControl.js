import React from 'react';
import PropTypes from 'prop-types';

import {Button} from 'react-bootstrap';
import Combobox from 'react-widgets/lib/Combobox';

const rest = require('./sheet-rest');

class AddMiscellaneousItemRow extends React.Component {
    constructor(props) {
        super(props);
        this.state = {selectedItem: undefined,
            choices: [],
            isBusy: true};
    }

    componentDidMount() {
        rest.getData(`/rest/miscellaneousitems/campaign/${this.props.campaign}/`).then(
            (json) => {
                this.setState({
                    choices: json, isBusy: false})
            }
        ).catch((err) => console.log(err));
    }

    isValid() {
        return typeof(this.state.selectedItem) === "object";
    }

    handleChange(value) {
        this.setState({selectedItem: value});
    }

    handleAdd() {
        if (this.isValid()) {
            this.props.onAdd(this.state.selectedItem);
            this.setState({selectedItem: undefined});
        }
    }

    render() {
        return <tfoot>
        <tr style={this.props.style}>
            <td>
            <Combobox data={this.state.choices}
                      value={this.state.selectedItem}
                      busy={this.state.isBusy}
                      textField="name"
                      filter="contains"
                      onChange={(value) => this.handleChange(value)} />
            </td>
        </tr>
        <tr>
            <td>
            <Button size="sm" disabled={!this.isValid()}
                    ref={(c) => this._addButton = c}
                    onClick={() => this.handleAdd()}>
                Add Item</Button>
                <a href="/sheets/add_miscellaneous_item/">Create a new item</a>
            </td>
        </tr>
        </tfoot>
    }
}

AddMiscellaneousItemRow.props = {
    campaign: PropTypes.number.isRequired,
    onAdd: PropTypes.func
};

export default AddMiscellaneousItemRow;
