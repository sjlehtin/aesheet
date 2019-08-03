import React from 'react';
import PropTypes from 'prop-types';

import {Button} from 'react-bootstrap';
import Combobox from 'react-widgets/lib/Combobox';

const rest = require('./sheet-rest');

class AddTransientEffectRow extends React.Component {
    constructor(props) {
        super(props);
        this.state = {selectedEffect: undefined,
            choices: [],
            isBusy: true};
    }

    componentDidMount() {
        rest.getData(`/rest/transienteffects/campaign/${this.props.campaign}/`).then(
            (json) => {
                this.setState({
                    choices: json, isBusy: false})
            }
        ).catch((err) => console.log(err));
    }

    isValid() {
        return typeof(this.state.selectedEffect) === "object";
    }

    handleChange(value) {
        this.setState({selectedEffect: value});
    }

    handleAdd() {
        if (this.isValid()) {
            this.props.onAdd(this.state.selectedEffect);
            this.setState({selectedEffect: undefined});
        }
    }

    render() {
        return <tfoot>
        <tr style={this.props.style}>
            <td>
            <Combobox data={this.state.choices}
                      value={this.state.selectedEffect}
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
                Add Effect</Button>
                <a href="/sheets/add_transient_effect/">Create a new effect</a>
            </td>
        </tr>
        </tfoot>
    }
}

AddTransientEffectRow.props = {
    campaign: PropTypes.number.isRequired,
    onAdd: PropTypes.func
};

export default AddTransientEffectRow;
