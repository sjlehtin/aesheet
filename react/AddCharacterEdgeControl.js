import React from 'react';
import PropTypes from 'prop-types';

import {Grid, Col, Row, Label, Button} from 'react-bootstrap';

import Combobox from 'react-widgets/Combobox';

const rest = require('./sheet-rest');

// TODO: add tests

class AddEdgeLevelControl extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            isBusy: false,
            // isOpen: false
            edgeLevelChoices: []
        }
    }

    async loadEdgeLevels() {
        this.setState({isBusy: true});
        const json = await rest.getData(`/rest/edgelevels/campaign/${this.props.campaign}/`)
        this.setState({
            edgeLevelChoices: json,
            isBusy: false
        })
    }

    async componentDidMount() {
        await this.loadEdgeLevels();
    }

    handleEdgeLevelChange(value) {
        this.setState({selectedEdgeLevel: value});
    }

    handleAdd() {
        console.log("adding:",
            this.state.selectedEdgeLevel);
        if (this.props.onAdd) {
            this.props.onAdd(this.state.selectedEdgeLevel);

            this.setState({selectedEdgeLevel: null});
        }
    }

    fieldsValid() {
        if (!this.state.selectedEdgeLevel) {
            return false;
        }
        if (typeof(this.state.selectedEdgeLevel) !== "object") {
            return false;
        }
        return true;
    }

    formatEdge(edge) {
        if (!edge) {
            return '';
        }
        if (typeof(edge) !== "object") {
            return edge;
        }
        return `${edge.edge.name} ${edge.level}`
    }

    render () {
        return <table>
            <tbody>
                <tr aria-label={"Add edge level"}>
                    <td><label id={"edgelevel"}>EdgeLevel</label>
                        <Combobox data={this.state.edgeLevelChoices}
                                  textField={(obj) => {
                                      return this.formatEdge(obj);
                                  }}
                                  aria-labelledby={"edgelevel"}
                                  open={this.state.isOpen}
                                  busy={this.state.isBusy}
                                  filter="contains"
                                  value={this.state.selectedEdgeLevel}
                                  onChange={(value) => this.handleEdgeLevelChange(value) } />
            <Button size="sm" disabled={!this.fieldsValid()}
                    ref={(c) => this._addButton = c}
                    onClick={() => this.handleAdd()}>
                Add EdgeLevel</Button>
                <div><a href="/sheets/add_edge/">Create a new edge</a>{' '}
                    <a href="/sheets/add_edge_level/">Create a new edge level</a>{' '}
                    <a href="/sheets/add_edge_skill_bonus/">Create a new skillbonus for edge level</a>
                </div>
                        </td>
         </tr>
            </tbody>
        </table>;
    }
}

AddEdgeLevelControl.propTypes = {
    campaign: PropTypes.number.isRequired,
    onAdd: PropTypes.func
};

export default AddEdgeLevelControl;
