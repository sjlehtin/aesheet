import React from 'react';
import {Table, Panel} from 'react-bootstrap';

var util = require('./sheet-util');

class MovementRates extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        var terrains = [{name: 'Road', mult: 1}, {name: 'Clear', mult: 2},
            {name: 'Scrub', mult: 3}, {name: 'Woods', mult: 4},
            {name: 'Sand', mult: 5}, {name: 'Forest', mult: 6},
         {name: 'Mountains', mult: 10}, {name: 'Swamp', mult: 15}];

        var terrainsRow = [];
        var milesPerDayRow = [];
        var milesPerHourRow = [];
        var spd = this.props.skillHandler.runningSpeed();
        for (let terrain of terrains) {
            terrainsRow.push(<th key={"ter-"+terrain.name}>{terrain.name}</th>);
            milesPerDayRow.push(<td key={"mpd-"+terrain.name}>
                {(spd/(2 * terrain.mult)).toFixed()}</td>);
            milesPerHourRow.push(<td key={"mph-"+terrain.name}>
                {(spd/(15 * terrain.mult)).toFixed(1)}</td>);
        }
        var flySpeed = this.props.skillHandler.flyingSpeed();
        terrainsRow.push(<th key="ter-fly">Fly</th>);
        milesPerDayRow.push(<td key="mpd-fly">{util.roundup(flySpeed/2)}</td>);
        milesPerHourRow.push(<td key="mph-fly">{util.roundup(flySpeed/15)}</td>);

        return <div><Panel header={<h4>Movement rates per turn</h4>}>
            <Table condensed fill>
                <thead><tr><th>Jump</th><th>Climb</th><th>Swim</th>
                    <th>Sneak</th><th>Run</th><th>Sprint</th><th>Fly</th>
                </tr></thead>
                <tbody>
                <tr>
                    <td><div>H = {this.props.skillHandler.jumpingDistance().toFixed(1)}</div><div>V = {this.props.skillHandler.jumpingHeight().toFixed(1)}</div></td>
                    <td>{this.props.skillHandler.climbingSpeed().toFixed(1)}</td>
                    <td>{util.roundup(this.props.skillHandler.swimmingSpeed())}</td>
                    <td>{util.roundup(this.props.skillHandler.sneakingSpeed().toFixed())}</td>
                    <td>{util.roundup(this.props.skillHandler.runningSpeed().toFixed())}</td>
                    <td>{util.roundup(this.props.skillHandler.sprintingSpeed().toFixed())}</td>
                    <td>{util.roundup(flySpeed.toFixed())}</td>
                </tr>
                </tbody>
            </Table>
        </Panel>
            <Panel header={<h4>Overland movement</h4>}>
                <Table condensed fill>
                    <thead><tr>
                        <td/>
                        {terrainsRow}
                    </tr></thead>
                    <tbody>
                    <tr><td>mpd</td>{milesPerDayRow}</tr>
                    <tr><td>mph</td>{milesPerHourRow}</tr>
                    </tbody>
                </Table>
            </Panel>
        </div>;
    }
}

MovementRates.propTypes = {
    skillHandler: React.PropTypes.object.isRequired
};

export default MovementRates;
