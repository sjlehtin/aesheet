import React from 'react';

import StatRow from 'StatRow';
import XPControl from 'XPControl';
import NoteBlock from 'NoteBlock';
import InitiativeBlock from 'InitiativeBlock';
import SkillTable from 'SkillTable';
import Loading from 'Loading';

import {Grid, Row, Col, Image, Panel} from 'react-bootstrap';

var rest = require('sheet-rest');
var util = require('sheet-util');

/**
 * TODO: controls to add bought_mana, bought_stamina, age sp, change
 * portrait, adventures, times wounded.
 */
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
            edgesBought: 0,
            characterSkills: undefined
        };
    }

    handleSkillsLoaded(skillList, allSkills) {
        this.setState({characterSkills: skillList,
        allSkills: allSkills});
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

                    rest.getData(this.state.url + 'characterskills/').then(
                        (characterSkills) => {
                            rest.getData(
                                `/rest/skills/campaign/${json.campaign}/`)
                                .then((allSkills) => {
                                    this.handleSkillsLoaded(characterSkills,
                                    allSkills);
                                }).catch((err) => {
                                console.log("Failed load: ", err)});
                        }).catch(function (err) {console.log(err)});

                    /* TODO: would be better to have the edges with
                       contents from under the character URL, see
                       characterskills. */
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
        if (stat === "mov") {
            return this.effMOV();
        } else if (stat === "dex") {
            return this.effDEX();
        } else if (stat === "imm") {
            return this.effIMM();
        }
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

    getEffStats() {
        var block = {}
        var stats = ["fit", "ref", "lrn", "int", "psy", "wil", "cha",
                "pos", "mov", "dex", "imm"];
        for (var ii = 0; ii < stats.length; ii++) {
            block[stats[ii]] = this.effStat(stats[ii]);
        }
        return block;
    }

    baseBody() {
        return util.roundup(this.baseStat("fit") / 4);
    }

    toughness() {
        return this.getEdgeLevel("Toughness");
    }

    stamina() {
        return util.roundup((this.baseStat("ref") + this.baseStat("wil"))/ 4)
            + this.state.char.bought_stamina;
    }

    mana() {
        return util.roundup((this.baseStat("psy") + this.baseStat("wil"))/ 4)
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
        var highStat = util.rounddown((this.effIMM() - 45)/15);
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
        var highStat = 2*util.rounddown((this.effStat("cha") - 45)/15);
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

    runMultiplier() {
        /* TODO: Tests for run multiplier. */
        /* TODO: run multiplier from effects. */
        var total = 0;

        this.state.edgeList.forEach((elem, ii) =>
        total += parseFloat(elem.run_multiplier ));

        if (total > 0) {
            console.log("run multiplier:", total);
            return total;
        } else {
            return 1.0;
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


    handleCharacterSkillAdd(skill) {
        var skillList = this.state.characterSkills;
        skillList.push(skill);
        this.setState({characterSkills: skillList});
    }

    static findCharacterSkillIndex(skillList, skill) {
        for (var ii = 0; ii < skillList.length; ii++) {
            var item = skillList[ii];
            if (item.id === skill.id) {
                return ii;
            }
        }
        throw Error("No such skill: " + skill);
    }

    handleCharacterSkillRemove(skill) {
        console.log("Removed: ", skill);
        var index = StatBlock.findCharacterSkillIndex(
            this.state.characterSkills, skill);
        this.state.characterSkills.splice(index, 1);
        this.setState({characterSkills: this.state.characterSkills});
    }

    getCharacterSkillURL(cs) {
        return this.state.url + 'characterskills/' + cs.id + '/';
    }

    handleCharacterSkillModify(skill) {
        rest.patch(this.getCharacterSkillURL(skill), skill).then(() => {
            var index = StatBlock.findCharacterSkillIndex(
                this.state.characterSkills, skill);
            this.state.characterSkills.splice(index, 1, skill);
            this.setState({characterSkills: this.state.characterSkills});
        }).catch((err) => console.log(err));
    }

    render() {
        var rows, derivedRows, usableRows, xpcontrol, portrait, notes,
            initiativeBlock, description, skillTable;
        skillTable = <Loading />;
        if (typeof(this.state.char) === "undefined") {
            rows = <tr><td>Loading...</td></tr>;
            derivedRows = <tr><td>Loading...</td></tr>;
            usableRows = <tr><td>Loading...</td></tr>;
            xpcontrol = <div>Loading</div>;
            initiativeBlock = '';
            description = '';
        } else {
            description = <div>
                { this.state.char.race }
                { this.state.char.occupation }
            <p title="Character description">
                { this.state.char.description }
            </p>
            <p title="Sheet description">
                { this.state.sheet.description }
            </p>

            </div>;

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
                portrait = (
                    <div className="edit-control">You can add a portrait for
                        your character in the <a href="`/characters/edit_char/${
                        this.state.char}/`"> base character edit</a>.
                </div>);
            }

            var hasNotes = function (edgeList) {
                for (var ii = 0; ii < edgeList.length; ii++) {
                    if (edgeList[ii].notes.length > 0) {
                        return true;
                    }
                }
                return false;
            };

            if (hasNotes(this.state.edgeList)) {
                notes =
                    <Panel><NoteBlock edges={this.state.edgeList}/></Panel>;
            } else {
                notes = '';
            }

            initiativeBlock =
                <InitiativeBlock style={{fontSize: "80%"}}
                                 effMOV={this.effMOV()}
                                 runMultiplier={this.runMultiplier()} />;

            if (typeof(this.state.characterSkills) !== "undefined") {
                if (!this.state.allSkills ||
                    this.state.allSkills.length === 0) {
                    /* Mostly to get tests that do not need skills to not
                     care about the skilltable. */
                    skillTable = <div>No skills.</div>
                } else {
                    skillTable = <SkillTable
                        style={{fontSize: "90%"}}
                        characterSkills={this.state.characterSkills}
                        allSkills={this.state.allSkills}
                        onCharacterSkillRemove={
                      (skill) => this.handleCharacterSkillRemove(skill)}
                        onCharacterSkillModify={
                      (skill) => this.handleCharacterSkillModify(skill)}
                        effStats={this.getEffStats()}
                        baseStats={this.getEffStats()}
                    />
                }
            }
        }


        var statsStyle = {verticalAlign: "center", border: 1};

        return (
            <Grid>
            <Row>
                <Col md={4}>
                    <Row>
                        {description}
                    </Row>
                    <Row>
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
                    </Row>
                </Col>
                <Col md={4}>
                    <Row style={{paddingBottom: 5}}>
                        {portrait}
                    </Row>
                    <Row>
                        {notes}
                    </Row>
                    <Row>
                        {initiativeBlock}
                    </Row>
                </Col>
                <Col md={4}>
                    {skillTable}
                </Col>
            </Row>

                </Grid>
        )
    }
}

StatBlock.propTypes = {
    url: React.PropTypes.string.isRequired,
    onCharacterSkillAdd: React.PropTypes.func,
    onCharacterSkillRemove: React.PropTypes.func,
    onCharacterSkillModify: React.PropTypes.func
};

export default StatBlock;
