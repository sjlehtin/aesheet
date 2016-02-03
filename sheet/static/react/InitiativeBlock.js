import React from 'react';

import {Panel, Table, Input} from 'react-bootstrap';

var util = require('sheet-util');

class InitiativeBlock extends React.Component {

    constructor(props) {
        super(props);
        this.state = {distance: 30};
    }

    initiatives(constant, distances) {
        return distances.map((distance) => {
            return util.roundup(
                (-constant * distance) /
                (this.props.effMOV * this.props.runMultiplier));
        });
    }

    render() {
        var distances = [this.state.distance, 20, 10, 5, 2];
        var charging = this.initiatives(20, distances);
        var melee = this.initiatives(30, distances);
        var ranged = this.initiatives(60, distances);
        var getItems = function (initiatives) {
            return initiatives.map((init, ii) => { return <td key={ii}>{init}</td>; });
        }
        return <Panel style={this.props.style} header={
          <h4>Initiative penalty for advancing in combat</h4>}>
            <Table style={{fontSize: "inherit"}} fill>
                <thead>
                    <tr>
                        <th>Distance</th>
                        <th>
                            <input type="text" style={{width: "3em"}}
                                //style={{fontSize: "inherit"}}
                                   //style={{fontSize: "inherit", height:
                                // "2em", width: "3em", paddingLeft: 5, textAlign: "right", }}
                                   //addonAfter="m"
                                   value={this.state.distance}
                                   //ref={(c) => {
                                   //if (c) {
                                   //  this._inputNode = c.getInputDOMNode()}}}
                                ref={(c) => { this._inputNode = c }}
                                   onChange={(e) => {this.setState({distance: e.target.value})}}
                            /> m
                        </th>
                        {distances.slice(1).map((elem, ii) => {
                            return <th key={ii}>{elem} m</th>})}</tr>
                </thead>
                <tbody>
                <tr><td>Charge</td>{getItems(charging)}</tr>
                <tr><td>Melee</td>{getItems(melee)}</tr>
                <tr><td>Ranged / casting</td>{getItems(ranged)}</tr>
                </tbody>
            </Table>
        </Panel>;
    }
}

InitiativeBlock.propTypes = {
    effMOV: React.PropTypes.number.isRequired,
    runMultiplier: React.PropTypes.number
};

InitiativeBlock.defaultProps = {runMultiplier: 1};

export default InitiativeBlock;
