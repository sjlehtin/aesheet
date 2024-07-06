import React from 'react';
import PropTypes from 'prop-types';

import {Table, Card} from 'react-bootstrap';
import StatBreakdown from "./StatBreakdown";

const util = require('./sheet-util');

class MovementRates extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        const terrains = [{name: 'Road', mult: 1}, {name: 'Clear', mult: 2},
            {name: 'Scrub', mult: 3}, {name: 'Woods', mult: 4},
            {name: 'Sand', mult: 5}, {name: 'Forest', mult: 6},
         {name: 'Mountains', mult: 10}, {name: 'Swamp', mult: 15}];

        const terrainsRow = [];
        const milesPerDayRow = [];
        const milesPerHourRow = [];
        const spd = this.props.skillHandler.runningSpeed().value();
        for (let terrain of terrains) {
            terrainsRow.push(<th key={"ter-"+terrain.name}>{terrain.name}</th>);
            milesPerDayRow.push(<td key={"mpd-"+terrain.name}>
                {(spd/(2 * terrain.mult)).toFixed()}</td>);
            milesPerHourRow.push(<td key={"mph-"+terrain.name}>
                {(spd/(15 * terrain.mult)).toFixed(1)}</td>);
        }
        const flySpeed = this.props.skillHandler.flyingSpeed().value();
        terrainsRow.push(<th key="ter-fly">Fly</th>);
        milesPerDayRow.push(<td key="mpd-fly">{util.roundup(flySpeed/2)}</td>);
        milesPerHourRow.push(<td key="mph-fly">{util.roundup(flySpeed/15)}</td>);

        return <div>
            <Card className={"m-1"}>
                <Card.Header>
                    <h4>Movement rates per turn</h4>
                </Card.Header>
                <Card.Body className={"table-responsive p-0"}>
            <Table size={"sm"}>
                <thead><tr><th>Jump</th><th>Climb</th><th>Swim</th>
                    <th>Sneak</th><th>Run</th><th>Sprint</th><th>Fly</th>
                </tr></thead>
                <tbody>
                <tr>
                    <td>
                        <div>H = <StatBreakdown value={this.props.skillHandler.jumpingDistance()} /></div>
                        <div>V = <StatBreakdown value={this.props.skillHandler.jumpingHeight()} /></div>
                    </td>
                    <td><StatBreakdown value={this.props.skillHandler.climbingSpeed()}/></td>
                    <td><StatBreakdown value={this.props.skillHandler.swimmingSpeed()}/></td>
                    <td><StatBreakdown value={this.props.skillHandler.sneakingSpeed()}/></td>
                    <td><StatBreakdown value={this.props.skillHandler.runningSpeed()}/></td>
                    <td><StatBreakdown value={this.props.skillHandler.sprintingSpeed()}/></td>
                    <td><StatBreakdown value={flySpeed}/></td>
                </tr>
                </tbody>
            </Table>
            </Card.Body>
        </Card>
        <Card className={"m-1"}>
            <Card.Header>
                <h4>Overland movement</h4>
            </Card.Header>
            <Card.Body className={"table-responsive p-0"}>
                <Table size={"sm"}>
                    <thead><tr>
                        <td/>
                        {terrainsRow}
                    </tr></thead>
                    <tbody>
                    <tr><td>mpd</td>{milesPerDayRow}</tr>
                    <tr><td>mph</td>{milesPerHourRow}</tr>
                    </tbody>
                </Table>
            </Card.Body>
        </Card>
        </div>;
    }
}

MovementRates.propTypes = {
    skillHandler: PropTypes.object.isRequired
};

export default MovementRates;
