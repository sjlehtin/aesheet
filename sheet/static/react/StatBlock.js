import React from 'react';

import StatRow from 'StatRow';
import XPControl from 'XPControl';
import NoteBlock from 'NoteBlock';

import {Row, Col, Image, Panel} from 'react-bootstrap';

var rest = require('sheet-rest');

/**
 * TODO: controls to add bought_mana, bought_stamina.
 */
/* Like excel roundup, rounds away from zero. */
var roundup = function (value) {
    "use strict";
    if (value < 0) {
        return Math.floor(value);
    } else {
        return Math.ceil(value);
    }
};

/* Like excel roundup, rounds away from zero. */
var rounddown = function (value) {
    "use strict";
    if (value < 0) {
        return Math.ceil(value);
    } else {
        return Math.floor(value);
    }
};

class StatBlock extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            sheet: undefined,
            char: undefined,
            /* This is preferred over the edges list in the char.  A
               subcomponent will handle the actual edges for the character,
               and will notify this component of changes. */
            edges: {},
            edgeList: [],
            /* Running total of edge cost. */
            edgesBought: 0
        };
    }

    componentDidMount() {
        rest.getData(this.props.url).then((json) => {
            this.setState({
                sheet: json,
                // Updates occur towards the character.
                url: `/rest/characters/${json.character}/`
            });
            rest.getData(this.state.url)
                .then((json) => {
                    this.setState({char: json});
                    /* TODO: until we have the EdgeComponent. */
                    Promise.all(json.edges.map(
                    (edge_id) => {
                        return rest.getData(`/rest/edgelevels/${edge_id}/`)
                            .then((json) => { this.handleEdgeAdded(json);
                            console.log("Added edge: ", json); })
                            .catch((err) => { console.log("got err:", err)});}))
                        .then((status) => { console.log("All loaded.")})
                        .catch((err) => { console.log("There was an error:",
                            err)});
                });
        });
    }

    baseStat(stat) {
        return this.state.char['cur_' + stat] + this.state.char['mod_' + stat];
    }

    effStat(stat) {
        return this.baseStat(stat) + this.state.sheet['mod_' + stat];
    }

    baseMOV() {
        return Math.round((this.baseStat("fit") + this.baseStat("ref"))/2) +
            this.state.char.mod_mov;
    }

    effMOV() {
        return Math.round((this.effStat("fit") + this.effStat("ref"))/2) +
            this.state.sheet.mod_mov;
    }

    baseDEX() {
        return Math.round((this.baseStat("ref") + this.baseStat("int"))/2) +
            this.state.char.mod_dex;
    }

    effDEX() {
        return Math.round((this.effStat("ref") + this.effStat("int"))/2) +
            this.state.sheet.mod_dex;
    }

    baseIMM() {
        return Math.round((this.baseStat("fit") + this.baseStat("psy"))/2) +
            this.state.char.mod_imm;
    }

    effIMM() {
        /* "Soft" bonuses do not apply to IMM. */
        return Math.round((this.baseStat("fit") + this.baseStat("psy"))/2) +
            this.state.sheet.mod_imm;
    }

    getEdgeLevel(edge) {
        if (typeof(this.state.edges[edge]) !== "undefined") {
            return this.state.edges[edge].level;
        } else {
            return 0;
        }
    }

    baseBody() {
        return roundup(this.baseStat("fit") / 4);
    }

    toughness() {
        return this.getEdgeLevel("Toughness");
    }

    stamina() {
        return roundup((this.baseStat("ref") + this.baseStat("wil"))/ 4)
            + this.state.char.bought_stamina;
    }

    mana() {
        return roundup((this.baseStat("psy") + this.baseStat("wil"))/ 4)
            + this.state.char.bought_mana;
    }

    bodyHealing() {
        var level = this.getEdgeLevel("Fast Healing");
        if (level > 0) {
            var _lookupFastHealing = {
                1: "3/8d",
                2: "3/4d",
                3: "3/2d",
                4: "1/8h",
                5: "1/4h",
                6: "1/2h"
            };
            return _lookupFastHealing[level];
        } else {
            return "3/16d";
        }

    }

    staminaRecovery() {
        /* High stat: ROUNDDOWN((IMM-45)/15;0)*/
        var highStat = rounddown((this.effIMM() - 45)/15);
        var level = this.getEdgeLevel("Fast Healing");

        var rates = [];

        if (highStat != 0) {
            rates.push(highStat);
        }
        if (level > 0) {
            var _lookupFastHealing = {
                1: "1d6",
                2: "2d6",
                3: "4d6",
                4: "8d6",
                5: "16d6",
                6: "32d6"
            };
            rates.push(_lookupFastHealing[level]);
        }
        if (rates.length) {
            return rates.join('+') + "/8h";
        } else {
            return ""
        }
    }

    manaRecovery() {
        /* High stat: 2*ROUNDDOWN((CHA-45)/15;0)*/
        var highStat = 2*rounddown((this.effStat("cha") - 45)/15);
        var level = this.getEdgeLevel("Fast Mana Recovery");

        var rates = [];

        if (highStat != 0) {
            rates.push(highStat);
        }
        if (level > 0) {
            var _lookupManaRecovery = {
                1: "2d6",
                2: "4d6",
                3: "8d6",
                4: "16d6",
                5: "32d6",
                6: "64d6"
            };
            rates.push(_lookupManaRecovery[level]);
        }
        if (rates.length) {
            return rates.join('+') + "/8h";
        } else {
            return ""
        }
    }

    handleEdgeAdded(data) {
        /* This assumes that characters will only have a single edgelevel of
           an edge.  I think this is an invariant.

           TODO: The lower level (the upcoming EdgeComponent) will need to
           remove old edgelevels when an upgraded level is added; otherwise
           the database will contain crud from the past, which may then pop
           up when, e.g., trying to remove edges. */
        var update = {};
        update[data.edge] = data;

        this.state.edgeList.push(data);
        var newList = this.state.edgeList;

        this.setState({edges: Object.assign({}, this.state.edges, update),
            /* TODO: the data in JSON will have the floats rendered as
             strings.   Anyway around this? */
            edgesBought: this.state.edgesBought + parseFloat(data.cost),
            edgeList: newList
        });
    }

    handleModification(stat, oldValue, newValue) {
        var data = this.state.char;
        data["cur_" + stat] = newValue;
        this.setState({char: data});
    }

    handleXPMod(field, oldValue, newValue) {
        var data = this.state.char;
        data.total_xp = newValue;
        this.setState({char: data});
    }

    render() {
        var rows, derivedRows, usableRows, xpcontrol, portrait, notes;
        if (typeof(this.state.char) === "undefined") {
            rows = <tr><td>Loading...</td></tr>;
            derivedRows = <tr><td>Loading...</td></tr>;
            usableRows = <tr><td>Loading...</td></tr>;
            xpcontrol = <div>Loading</div>
        } else {
            var stats = ["fit", "ref", "lrn", "int", "psy", "wil", "cha",
                "pos"];
            rows = stats.map(function(st, ii) {
                return <StatRow stat={st}
                                key={ii}
                                initialChar={this.state.char}
                                initialSheet={this.state.sheet}
                                onMod={this.handleModification.bind(this)}
                                url={this.state.url} />;
            }.bind(this));

            var baseStyle = {
                textAlign: "right",
                paddingLeft: 5,
                minWidth: "2em"
            };
            var effStyle = { fontWeight: "bold" };
            effStyle = Object.assign(effStyle, baseStyle);
            var statStyle = { fontWeight: "bold" };

            derivedRows =[
                (<tr key="mov">
                        <td style={statStyle}>MOV</td>
                        <td style={baseStyle}>{this.baseMOV()}</td>
                        <td style={effStyle}>{this.effMOV()}</td>
                    </tr>),
                (<tr key="dex">
                        <td style={statStyle}>DEX</td>
                        <td style={baseStyle}>{this.baseDEX()}</td>
                        <td style={effStyle}>{this.effDEX()}</td>
                    </tr>),
                (<tr key="imm">
                        <td style={statStyle}>IMM</td>
                        <td style={baseStyle}>{this.baseIMM()}</td>
                        <td style={effStyle}>{this.effIMM()}</td>
                    </tr>)
                ];

            xpcontrol = <XPControl
                url={this.state.url} edgesBought={this.state.edgesBought}
                initialChar={this.state.char}
                onMod={this.handleXPMod.bind(this)} />;

            var toughness = this.toughness();
            if (toughness) {
                toughness = (<span>+<span
                    style={{ fontWeight: "bold"}}>{toughness}</span></span>);
            } else {
                toughness = "";
            }

            var recoveryStyle = {
                color: "grey",
                paddingLeft: 5
            };
            usableRows = [
                (<tr key="body"><td style={statStyle}>B</td>
                    <td style={baseStyle}>{this.baseBody()}{toughness}</td>
                    <td style={recoveryStyle}>{this.bodyHealing()}</td></tr>),
                (<tr key="stamina"><td style={statStyle}>S</td>
                    <td style={baseStyle}>{this.stamina()}</td>
                    <td style={recoveryStyle}>{this.staminaRecovery()}</td></tr>),
                (<tr key="mana"><td style={statStyle}>M</td>
                    <td style={baseStyle}>{this.mana()}</td>
                    <td style={recoveryStyle}>{this.manaRecovery()}</td></tr>)
            ];

            if (this.state.char.portrait) {
                portrait = <Image style={{maxWidth: 300}} src={this.state.char.portrait} rounded />;
            } else {
                portrait = <div className="edit-control">
                    You can add a portrait for your character in the
                    <a href="`/characters/edit_char/${this.state.char}/`">
                        base character edit</a>.
                </div>;
            }
            notes = <Panel><NoteBlock edges={this.state.edgeList} /></Panel>;
        }

        var statsStyle = {verticalAlign: "center", border: 1};

        return (
            <Row>
                <Col md={5}>
                <div style={{position: "relative", width: "18em"}}>
                <h4>Stats</h4>
                <table style={statsStyle}>
                    <tbody>
                    {rows}
                    </tbody>
                    <tbody>
                    {derivedRows}
                    </tbody>
                </table>
                <div style={{position: "absolute", bottom: 0, right:0}}>
                    <table>
                        <tbody>
                        {usableRows}
                        </tbody>
                    </table>
                </div>
                </div>
                {xpcontrol}
                    </Col>
                <Col md={7}>
                    <Row style={{paddingBottom: 5}}>
                        {portrait}
                    </Row>
                    <Row>
                        {notes}
                    </Row>
                </Col>
            </Row>
        )
    }
}

StatBlock.propTypes = {
    url: React.PropTypes.string.isRequired
};

export default StatBlock;
