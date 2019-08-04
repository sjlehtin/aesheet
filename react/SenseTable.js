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
import PropTypes from 'prop-types';

import {Table, Card} from 'react-bootstrap';

class SenseTable extends React.Component {

    static getChecks(baseNumChecks, baseCheck) {
        let checks = [];
        for (let ii = 0; ii < baseNumChecks + baseCheck.detectionLevel; ii++) {
            checks.push(baseCheck.check + ii * 10);
        }
        checks.reverse();
        return checks;
    }

    static getCheckCells(baseCheck, baseNumChecks, isVision) {
        const checks = this.getChecks(baseNumChecks, baseCheck);

        return SenseTable.renderCheckCells(checks, baseCheck.detectionLevel,
            isVision);
    }

    static getPadCells(numPad) {
        let cells = [];
        for (let ii = 0; ii < numPad; ii++) {
            cells.push(<td key={"pad-" + ii}/>);
        }
        return cells;
    }

    static renderCheckCells(checks, relevantDetectionLevel, isVision) {
        const baseStyle = {};
        checks = checks.map((chk, ii) => {
            let props = {}, extras = {};
            if (typeof(isVision) !== "undefined" && isVision) {
                if (chk >= 100) {
                    extras.fontWeight = 'bold';
                }

                if (chk <= 75) {
                    extras.color = 'hotpink';
                    props = {title: `Ranged penalty: ${75 - chk}`};
                }
            }
            let style = Object.assign({}, baseStyle, extras);
            return <td className="check" key={"chk-" + ii} style={style} {...props}>{chk}</td>;
        });

        const numPad = 12 - checks.length;
        checks = checks.concat(SenseTable.getPadCells(numPad));

        checks.splice(0, 0, <td key="level">{relevantDetectionLevel}</td>);
        return checks;
    }

    renderVisionChecks() {
        return SenseTable.getCheckCells(this.props.handler.dayVisionCheck(),
            SenseTable.BASE_VISION_RANGE, true);
    }

    renderNightVisionChecks(detectionLevel) {
        const check = this.props.handler.nightVisionCheck();

        let checks;
        if (detectionLevel < -4 && check.darknessDetectionLevel < 4) {
            // "Night Vision 4 indicates full darkvision (ability to see
            // even in complete darkness)."
            checks = [];
        } else {

            const totalDarknessDL = Math.min(0,
                detectionLevel + check.darknessDetectionLevel);

            checks = SenseTable.getChecks(
                SenseTable.BASE_VISION_RANGE + totalDarknessDL,
                check);
            checks = checks.map((chk) => {
                return chk + 10 * totalDarknessDL;
            });
        }
        return SenseTable.renderCheckCells(checks,
            check.darknessDetectionLevel, true);
    }

    renderHearingChecks() {
        return SenseTable.getCheckCells(this.props.handler.hearingCheck(),
            SenseTable.BASE_HEARING_RANGE);
    }

    renderSmellChecks() {
        return SenseTable.getCheckCells(this.props.handler.hearingCheck(),
            SenseTable.BASE_SMELL_RANGE);
    }

    renderTouchChecks() {
        let baseCheck = this.props.handler.touchCheck();
        return SenseTable.renderCheckCells([baseCheck.check],
            baseCheck.detectionLevel);
    }

    renderSurpriseChecks() {
        let baseCheck = this.props.handler.surpriseCheck();
        return [<td key="empty"/>,
            <td className="check" key="check">{baseCheck}</td>]
            .concat(SenseTable.getPadCells(11));
    }

    render() {
        const noteStyle = {fontSize: "60%", color: "gray"};
        return <Card className={"m-1"}>
            <Card.Header>
                <h4>Senses</h4>
            </Card.Header>
            <Card.Body className={"table-responsive p-0"}>
            <Table size={"sm"}>
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
        <tr ref={(c) => this._visionCheckRow = c}><th>Day</th>
            {this.renderVisionChecks()}<td/></tr>
        <tr style={{}}><th>Night 1</th>
            {this.renderNightVisionChecks(-1)}<td style={noteStyle}>-1, Dusk</td></tr>
        <tr ref={(c) => this._nightVision2CheckRow = c} style={{}}><th>Night 2</th>
            {this.renderNightVisionChecks(-2)}<td style={noteStyle}>-2, Artificial light</td></tr>
        <tr ref={(c) => this._nightVision3CheckRow = c} style={{}}><th>Night 3</th>
            {this.renderNightVisionChecks(-3)}<td style={noteStyle}>-3, Moonlight</td></tr>
        <tr ref={(c) => this._nightVision4CheckRow = c} style={{}}><th>Night 4</th>
            {this.renderNightVisionChecks(-4)}<td style={noteStyle}>-4, Darkness</td></tr>
        <tr ref={(c) => this._nightVision7CheckRow = c} style={{}}><th>Night 7</th>
            {this.renderNightVisionChecks(-7)}<td style={noteStyle}>-7, Pitch black</td></tr>
        <tr ref={(c) => this._hearingCheckRow = c}><th>Hearing</th>
            {this.renderHearingChecks()}<td/></tr>
        <tr ref={(c) => this._smellCheckRow = c}><th>Smell</th>
            {this.renderSmellChecks()}<td/></tr>
        <tr ref={(c) => this._touchCheckRow = c}><th>Touch</th>
            {this.renderTouchChecks()}<td/></tr>
        <tr ref={(c) => this._surpriseCheckRow = c}><th>Surprise</th>
            {this.renderSurpriseChecks()}<td/></tr>
        </tbody>
        </Table>
            <div style={{fontStyle: "italic"}}>
                <div><span style={{fontWeight: 'bold'}}>Bold</span> means you can bump with ranged attacks.</div>
                <div><span style={{color: 'hotpink'}}>Hotpink</span> means you will suffer a penalty to your ranged attacks to this range.</div>
                <div>Passive observation checks can be attempted every 6 minutes.</div>
                <div>Active observation checks can be attempted every 3 minutes.</div>
            </div>
            </Card.Body>
    </Card>;
    }
}

SenseTable.BASE_VISION_RANGE = 9;
SenseTable.BASE_HEARING_RANGE = 6;
SenseTable.BASE_SMELL_RANGE  = 3;

SenseTable.propTypes = {
    handler: PropTypes.object.isRequired
};

export default SenseTable;