import React from 'react';
import {Table, Panel} from 'react-bootstrap';

var util = require('sheet-util');

class MovementRates extends React.Component {
    constructor(props) {
        super(props);
    }

    climbingSpeed() {
        var level = this.props.skillHandler.skillLevel('Climbing');
        var rate;
        if (typeof(level) !== 'number') {
            rate = this.props.statHandler.getEffStats().mov / 60;
        } else {
            rate = this.props.statHandler.getEffStats().mov / 30 + level;
        }

        var edgeRate = this.props.statHandler.getEdgeModifier('climb_multiplier');
        var effRate = this.props.statHandler.getEffectModifier('climb_multiplier');
        if (edgeRate) {
            rate *= edgeRate;
        }
        if (effRate) {
            rate *= effRate;
        }
        return rate;
    }

    swimmingSpeed() {
        var level = this.props.skillHandler.skillLevel('Swimming');
        var rate;
        if (typeof(level) !== 'number') {
            rate = this.props.statHandler.getEffStats().mov / 10;
        } else {
            rate = this.props.statHandler.getEffStats().mov / 5 + level * 5;
        }

        var edgeRate = this.props.statHandler.getEdgeModifier('swim_multiplier');
        var effRate = this.props.statHandler.getEffectModifier('swim_multiplier');
        if (edgeRate) {
            rate *= edgeRate;
        }
        if (effRate) {
            rate *= effRate;
        }
        return rate;
    }

    flyingSpeed() {
        var canFly = false;
        var rate = this.props.statHandler.getEffStats().mov;
        var edgeRate = this.props.statHandler.getEdgeModifier('fly_multiplier');
        var effRate = this.props.statHandler.getEffectModifier('fly_multiplier');
        if (edgeRate) {
            rate *= edgeRate;
            canFly = true;
        }
        if (effRate) {
            rate *= effRate;
            canFly = true;
        }

        if (canFly) {
            return rate;
        } else {
            return 0;
        }
    }

    jumpingDistance() {
        var level = this.props.skillHandler.skillLevel('Jumping');
        var rate;
        if (typeof(level) !== 'number') {
            rate = this.props.statHandler.getEffStats().mov / 24;
        } else {
            rate = this.props.statHandler.getEffStats().mov / 12 + level*0.75;
        }

        var edgeRate = this.props.statHandler.getEdgeModifier('run_multiplier');
        var effRate = this.props.statHandler.getEffectModifier('run_multiplier');
        if (edgeRate) {
            rate *= edgeRate;
        }
        if (effRate) {
            rate *= effRate;
        }
        return rate;

    }

    jumpingHeight() {
        return this.jumpingDistance() / 3;
    }

    runningSpeed() {
        var rate = this.props.statHandler.getEffStats().mov;

        var edgeRate = this.props.statHandler.getEdgeModifier('run_multiplier');
        var effRate = this.props.statHandler.getEffectModifier('run_multiplier');
        if (edgeRate) {
            rate *= edgeRate;
        }
        if (effRate) {
            rate *= effRate;
        }
        return rate;

    }

    sprintingSpeed() {
        return this.runningSpeed() * 1.5;
    }

    sneakingSpeed() {
        return this.props.statHandler.getEffStats().mov / 5;
    }

    render() {
        var terrains = [{name: 'Road', mult: 1}, {name: 'Clear', mult: 2},
            {name: 'Scrub', mult: 3}, {name: 'Woods', mult: 4},
            {name: 'Sand', mult: 5}, {name: 'Forest', mult: 6},
         {name: 'Mountains', mult: 10}, {name: 'Swamp', mult: 15}];

        var terrainsRow = [];
        var milesPerDayRow = [];
        var milesPerHourRow = [];
        var spd = this.runningSpeed();
        for (let terrain of terrains) {
            terrainsRow.push(<th key={"ter-"+terrain.name}>{terrain.name}</th>);
            milesPerDayRow.push(<td key={"mpd-"+terrain.name}>
                {(spd/(2 * terrain.mult)).toFixed()}</td>);
            milesPerHourRow.push(<td key={"mph-"+terrain.name}>
                {(spd/(15 * terrain.mult)).toFixed(1)}</td>);
        }
        var flySpeed = this.flyingSpeed();
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
                    <td><div>H = {this.jumpingDistance().toFixed(1)}</div><div>V = {this.jumpingHeight().toFixed(1)}</div></td>
                    <td>{this.climbingSpeed().toFixed(1)}</td>
                    <td>{util.roundup(this.swimmingSpeed())}</td>
                    <td>{util.roundup(this.sneakingSpeed().toFixed())}</td>
                    <td>{util.roundup(this.runningSpeed().toFixed())}</td>
                    <td>{util.roundup(this.sprintingSpeed().toFixed())}</td>
                    <td>{util.roundup(this.flyingSpeed().toFixed())}</td>
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
    skillHandler: React.PropTypes.object.isRequired,
    statHandler: React.PropTypes.object.isRequired
};

export default MovementRates;
