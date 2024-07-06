import React from 'react';
import PropTypes from 'prop-types';

import {Card, Table} from 'react-bootstrap';

const util = require('./sheet-util');

class InitiativeBlock extends React.Component {

    constructor(props) {
        super(props);
        this.state = {distance: 30};
    }

    initiatives(constant, distances) {
        return distances.map((distance) => {
            const speed = this.props.stats.runningSpeed().value();
            if (speed > 0) {
                return util.roundup(
                    (-constant * distance) /
                    speed);
            } else {
                return "-";
            }
        });
    }

    render() {
        let distance = this.props.distance;
        let distanceControl
        if (typeof(distance) !== "number") {
            distance = this.state.distance
            distanceControl =
                <input aria-labelledby="distanceLabel" type="text"
                       style={{width: "3em"}}
                       value={this.state.distance}
                       onChange={(e) => {
                           this.setState({distance: e.target.value})
                       }}
                />
        } else {
            distanceControl = <span>{distance} m</span>
        }
        var distances = [distance, 20, 10, 5, 2];
        var charging = this.initiatives(20, distances);
        var melee = this.initiatives(30, distances);
        var ranged = this.initiatives(60, distances);
        var getItems = function (initiatives) {
            return initiatives.map((init, ii) => { return <td aria-label={"check"} key={ii}>{init}</td>; });
        }
        return <Card className={"m-1"} style={this.props.style}>
            <Card.Header>
                <h4>Initiative penalty for advancing in combat</h4>
            </Card.Header>
            <Card.Body className={"table-responsive p-0"}>
            <Table style={{fontSize: "inherit"}} size={"sm"}>
                <thead>
                    <tr>
                        <th><label id={"distanceLabel"}>Distance</label></th>
                        <th>
                            {distanceControl}
                        </th>
                        {distances.slice(1).map((elem, ii) => {
                            return <th key={ii}>{elem} m</th>})}
                    </tr>
                </thead>
                <tbody>
                <tr aria-label={"Charge initiatives"}><td>Charge</td>{getItems(charging)}</tr>
                <tr aria-label={"Melee initiatives"}><td>Melee</td>{getItems(melee)}</tr>
                <tr aria-label={"Ranged initiatives"}><td>Ranged / casting</td>{getItems(ranged)}</tr>
                </tbody>
            </Table>
            </Card.Body>
        </Card>;
    }
}

InitiativeBlock.propTypes = {
    stats: PropTypes.object.isRequired,
    distance: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
};

export default InitiativeBlock;
