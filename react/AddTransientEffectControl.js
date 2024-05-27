import React from 'react';
import PropTypes from 'prop-types';

import {Button, Row, Col} from 'react-bootstrap';
import Combobox from 'react-widgets/Combobox';

const rest = require('./sheet-rest');

class AddTransientEffectRow extends React.Component {
    constructor(props) {
        super(props);
        this.state = {selectedEffect: undefined,
            choices: [],
            isBusy: true};
    }

    async componentDidMount() {
        const json = await rest.getData(`/rest/transienteffects/campaign/${this.props.campaign}/`)
        this.setState({ choices: json, isBusy: false} )
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
        return <Row>
            <Col>
            <Combobox data={this.state.choices}
                      value={this.state.selectedEffect}
                      busy={this.state.isBusy}
                      textField="name"
                      aria-label={"Add transient effect"}
                      filter="contains"
                      onChange={(value) => this.handleChange(value)} />
            </Col>
            <Col>
            <Button size="sm" disabled={!this.isValid()}
                    onClick={() => this.handleAdd()}>
                Add Effect</Button>
                <a href="/sheets/add_transient_effect/">Create a new effect</a>
            </Col>
        </Row>;
    }
}

AddTransientEffectRow.props = {
    campaign: PropTypes.number.isRequired,
    onAdd: PropTypes.func
};

export default AddTransientEffectRow;
