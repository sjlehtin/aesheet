/*
Baseline ranges:
- Vision: 1000 m
- Hearing: 100 m
- Smell: 10 m

At baseline, INT is directly used.
Daylight: Acute Vision (+DL) or Poor Vision (-DL)
Night Vision: Night Vision (+DL)
Hearing: Acute Hearing, Poor Hearing

In night vision, the DL for the darkness incurs a penalty in addition to
reducing the range.  Acute vision helps, but is halved and rounded down.

Negative total DL prevents detection.  Thus, a person without Acute Vision
cannot detect beyond a range of 1km in daylight.

close-2-5-10- 20-50-100 -200-500-1000- 2000-5000-10000

Armor and various bonuses may or may not affect the detection chances.
Sometimes the check is wanted without a helmet, for example.

Basically, all checks follow the same pattern; the last check is the
actual INT check, modified by armor or edges (etc), with darkness DL
modifying the check as well.  The check type and the DL just change the
"length" of the check row, with Acute Vision 2, we have 2 steps more
checks than without the edge.  All check rows follow the same heading
(2-...-10k or something), and thus we can just print all starting from
the shortest distance.

*/
import React from 'react';

import {Table, Panel} from 'react-bootstrap';

class SenseTable extends React.Component {

    static getCheckCells(baseCheck, baseNumChecks) {
        let checks = [];
        for (let ii = 0; ii < baseNumChecks + baseCheck.detectionLevel; ii++) {
            checks.push(baseCheck.check + ii * 10);
        }
        checks.reverse();

        return SenseTable.renderCheckCells(checks, baseCheck);
    }

    static getPadCells(numPad) {
        let cells = [];
        for (let ii = 0; ii < numPad; ii++) {
            cells.push(<td key={"pad-" + ii}/>);
        }
        return cells;
    }

    static renderCheckCells(checks, baseCheck) {
        checks = checks.map((chk, ii) => {
            return <td className="check" key={"chk-" + ii}>{chk}</td>;
        });


        const numPad = 12 - checks.length;
        checks = checks.concat(SenseTable.getPadCells(numPad));

        checks.splice(0, 0, <td key="level">{baseCheck.detectionLevel}</td>);
        return checks;
    }

    getVisionChecks() {
        return SenseTable.getCheckCells(this.props.handler.dayVisionCheck(),
            SenseTable.BASE_VISION_RANGE);
    }

    getHearingChecks() {
        return SenseTable.getCheckCells(this.props.handler.hearingCheck(),
            SenseTable.BASE_HEARING_RANGE);
    }

    getSmellChecks() {
        return SenseTable.getCheckCells(this.props.handler.hearingCheck(),
            SenseTable.BASE_SMELL_RANGE);
    }

    getTouchChecks() {
        let baseCheck = this.props.handler.touchCheck();
        return SenseTable.renderCheckCells([baseCheck.check], baseCheck);
    }

    getSurpriseChecks() {
        let baseCheck = this.props.handler.surpriseCheck();
        return [<td key="empty"/>,
            <td className="check" key="check">{baseCheck}</td>]
            .concat(SenseTable.getPadCells(11));
    }

    render() {
        return <Panel header={<h4>Senses</h4>}>
            <Table condensed fill>
        <thead>
            <tr>
                <th />
                <th>Lvl</th>
                <th>2</th><th>5</th><th>10</th>
                <th>20</th><th>50</th><th>100</th>
                <th>200</th><th>500</th><th>1k</th>
                <th>2k</th><th>5k</th><th>10k</th>
                <th />
            </tr>
        </thead>
        <tbody>
        <tr ref={(c) => this._visionCheckRow = c}><th>Day vision</th>
            {this.getVisionChecks()}<td/></tr>
        <tr ref={(c) => this._hearingCheckRow = c}><th>Hearing</th>
            {this.getHearingChecks()}<td/></tr>
        <tr ref={(c) => this._smellCheckRow = c}><th>Smell</th>
            {this.getSmellChecks()}<td/></tr>
        <tr ref={(c) => this._touchCheckRow = c}><th>Touch</th>
            {this.getTouchChecks()}<td/></tr>
        <tr ref={(c) => this._surpriseCheckRow = c}><th>Surprise</th>
            {this.getSurpriseChecks()}<td/></tr>
        </tbody>
        </Table>
    </Panel>;
    }
}

SenseTable.BASE_VISION_RANGE = 9;
SenseTable.BASE_HEARING_RANGE = 6;
SenseTable.BASE_SMELL_RANGE  = 3;

SenseTable.propTypes = {
    handler: React.PropTypes.object.isRequired
};

export default SenseTable;