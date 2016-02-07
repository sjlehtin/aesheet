import React from 'react';

import StatRow from 'StatRow';
import XPControl from 'XPControl';
import AddSPControl from 'AddSPControl';
import NoteBlock from 'NoteBlock';
import InitiativeBlock from 'InitiativeBlock';
import SkillTable from 'SkillTable';
import Loading from 'Loading';
import FirearmControl from 'FirearmControl';
import AddFirearmControl from 'AddFirearmControl';
import WeaponRow from 'WeaponRow';
import RangedWeaponRow from 'RangedWeaponRow';
import AddWeaponControl from 'AddWeaponControl';
import AddRangedWeaponControl from 'AddRangedWeaponControl';

const SkillHandler = require('SkillHandler').default;

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
            characterSkills: undefined,
            allSkills: undefined,

            firearmList: undefined,
            weaponList: undefined,
            rangedWeaponList: undefined
        };
    }

    handleFirearmsLoaded(firearmList) {
        console.log("Firearms loaded");
        this.setState({firearmList: firearmList});
    }

    handleWeaponsLoaded(weapons) {
        console.log("Weapons loaded");
        this.setState({weaponList: weapons});
    }

    handleRangedWeaponsLoaded(weapons) {
        console.log("Ranged weapons loaded");
        this.setState({rangedWeaponList: weapons});
    }

    handleSkillsLoaded(skillList, allSkills) {
        this.setState({characterSkills: skillList,
        allSkills: allSkills});
    }

    componentDidMount() {
        /* Failures to load objects from the server should be indicated
           visually to the users, as well as failures to save etc.  Use a
           error-handling control for this purpose. */

        rest.getData(this.props.url + 'sheetfirearms/').then((json) => {
            this.handleFirearmsLoaded(json);
        }).catch((err) => {console.log("Failed to load firearms:", err)});

        rest.getData(this.props.url + 'sheetweapons/').then((json) => {
            this.handleWeaponsLoaded(json);
        }).catch((err) => {console.log("Failed to load weapons:", err)});

        rest.getData(this.props.url + 'sheetrangedweapons/').then((json) => {
            this.handleRangedWeaponsLoaded(json);
        }).catch((err) => {console.log("Failed to load ranged weapons:",
            err)});

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

    /*
     * TODO:  Effects from SpellEffects, ArmorSpecialQualities,
     * WeaponSpecialQualities, MiscellanousItems, and Edges should be
     * combined and added to stats, skill levels, movement etc.
     *
     * Edges affect base stats ("hard" modifier) and the rest are
     * modifiers for the effective stats ("soft" modifier).
     */

    effStat(stat) {
        if (stat === "mov") {
            return this.effMOV();
        } else if (stat === "dex") {
            return this.effDEX();
        } else if (stat === "imm") {
            return this.effIMM();
        }
        return this.baseStat(stat) +
                // TODO:  this should be discarded, and the mods from
                // effects (see above) calculated, with the addition of
                // fit/ref penalties from armor and weight carried.
            this.state.sheet['mod_' + stat];
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
        var block = {};
        var stats = ["fit", "ref", "lrn", "int", "psy", "wil", "cha",
                "pos", "mov", "dex", "imm"];
        for (var ii = 0; ii < stats.length; ii++) {
            block[stats[ii]] = this.effStat(stats[ii]);
        }
        return block;
    }

    getBaseStats() {
        var block = {};
        var stats = ["fit", "ref", "lrn", "int", "psy", "wil", "cha",
                "pos"];
        for (var ii = 0; ii < stats.length; ii++) {
            block[stats[ii]] = this.baseStat(stats[ii]);
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
        rest.post(this.getCharacterSkillURL(), skill).then((json) => {
            if (!("skill" in json) || !("id" in json)) {
                throw Error("Got invalid reply", json);
            }
            var skillList = this.state.characterSkills;
            skillList.push(json);
            this.setState({characterSkills: skillList});
        }).then((err) => console.log(err));
    }

    handleAddGainedSP(addedSP) {
        var data = this.state.char,
            newGained = data.gained_sp + addedSP;

        rest.patch(this.state.url, {gained_sp: newGained}).then((json) => {
            data.gained_sp = newGained;
            this.setState({char: data});
        }).then((err) => console.log(err));
    }

    static findItemIndex(skillList, skill) {
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
        rest.delete(this.getCharacterSkillURL(skill)).then((json) => {
            var index = StatBlock.findItemIndex(
                this.state.characterSkills, skill);
            this.state.characterSkills.splice(index, 1);
            this.setState({characterSkills: this.state.characterSkills});
        }).catch((err) => console.log(err));
    }

    getCharacterSkillURL(cs) {
        var baseURL = this.state.url + 'characterskills/';
        if (cs) {
            return baseURL + cs.id + '/';
        } else {
            return baseURL;
        }
    }

    handleCharacterSkillModify(skill) {
        rest.patch(this.getCharacterSkillURL(skill), skill).then(() => {
            var index = StatBlock.findItemIndex(
                this.state.characterSkills, skill);
            this.state.characterSkills.splice(index, 1, skill);
            this.setState({characterSkills: this.state.characterSkills});
        }).catch((err) => console.log(err));
    }

    getFirearmURL(fa) {
        var baseURL = this.props.url + 'sheetfirearms/';
        if (fa) {
            return baseURL + fa.id + '/';
        } else {
            return baseURL;
        }
    }

    handleFirearmAdded(firearm) {
        rest.post(this.getFirearmURL(), {base: firearm.base.name,
        ammo: firearm.ammo.id}).then((json) => {
            console.log("POST success", json);
            firearm.id = json.id;
            var newList = this.state.firearmList;
            newList.push(firearm);
            this.setState({firearmList: newList});
        }).catch((err) => {console.log("error", err)});
    }

    handleFirearmRemoved(firearm) {
        rest.delete(this.getFirearmURL(firearm), firearm).then(
            (json) => {
                var index = StatBlock.findItemIndex(
                    this.state.firearmList, firearm);
                this.state.firearmList.splice(index, 1);
                this.setState({firearmList: this.state.firearmList});
            }).catch((err) => {console.log("Error in deletion: ", err)});
    }

    getWeaponURL(fa) {
        var baseURL = this.props.url + 'sheetweapons/';
        if (fa) {
            return baseURL + fa.id + '/';
        } else {
            return baseURL;
        }
    }

    handleWeaponAdded(weapon) {
        var data;
        if ('id' in weapon) {
            data = {weapon: weapon.id};
        } else {
            data = {
                base: weapon.base.name,
                quality: weapon.quality.name
            };
        }
        console.log("Adding: ", data, weapon);
        rest.post(this.getWeaponURL(), data).then((json) => {
            console.log("POST success", json);
            weapon.id = json.id;
            weapon.name = json.name;
            var newList = this.state.weaponList;
            newList.push(weapon);
            this.setState({weaponList: newList});
        }).catch((err) => {console.log("error", err)});
    }

    handleWeaponRemoved(weapon) {
        rest.delete(this.getWeaponURL(weapon), weapon).then(
            (json) => {
                var index = StatBlock.findCharacterSkillIndex(
                    this.state.weaponList, weapon);
                this.state.weaponList.splice(index, 1);
                this.setState({weaponList: this.state.weaponList});
            }).catch((err) => {console.log("Error in deletion: ", err)});
    }

    getRangedWeaponURL(rw) {
        var baseURL = this.props.url + 'sheetrangedweapons/';
        if (rw) {
            return baseURL + rw.id + '/';
        } else {
            return baseURL;
        }
    }

    handleRangedWeaponAdded(weapon) {
        var data;
        if ('id' in weapon) {
            data = {weapon: weapon.id};
        } else {
            data = {
                base: weapon.base.name,
                quality: weapon.quality.name
            };
        }
        console.log("Adding: ", data, weapon);
        rest.post(this.getRangedWeaponURL(), data).then((json) => {
            console.log("POST success", json);
            weapon.id = json.id;
            weapon.name = json.name;
            var newList = this.state.rangedWeaponList;
            newList.push(weapon);
            this.setState({rangedWeaponList: newList});
        }).catch((err) => {console.log("error", err)});
    }

    handleRangedWeaponRemoved(weapon) {
        rest.delete(this.getRangedWeaponURL(weapon), weapon).then(
            (json) => {
                var index = StatBlock.findItemIndex(
                    this.state.rangedWeaponList, weapon);
                this.state.rangedWeaponList.splice(index, 1);
                this.setState({rangedWeaponList:
                this.state.rangedWeaponList});
            }).catch((err) => {console.log("Error in deletion: ", err)});
    }

    renderDescription() {
        if (!this.state.char || !this.state.sheet) {
            return <Loading/>;
        }

        return <div>
            {this.state.char.race} {this.state.char.occupation}
            <p title="Character description">
                { this.state.char.description }
            </p>
            <p title="Sheet description">
                { this.state.sheet.description }
            </p>
        </div>;
    }

    renderNotes() {
        if (!this.state.edgeList) {
            return <Loading>Notes</Loading>;
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
            return <Panel><NoteBlock edges={this.state.edgeList}/></Panel>;
        } else {
            return '';
        }
    }

    renderSkills() {
        var skillHandler = this.getSkillHandler();
        if (!skillHandler) {
            return <Loading>Skills</Loading>
        }
        return <SkillTable
            style={{fontSize: "80%"}}
            skillHandler={skillHandler}
            characterSkills={this.state.characterSkills}
            allSkills={this.state.allSkills}
            onCharacterSkillRemove={
                      (skill) => this.handleCharacterSkillRemove(skill)}
            onCharacterSkillModify={
                      (skill) => this.handleCharacterSkillModify(skill)}
            onCharacterSkillAdd={
                      (skill) => this.handleCharacterSkillAdd(skill)}
            effStats={this.getEffStats()}
            baseStats={this.getBaseStats()}
            character={this.state.char}
        />
    }

    renderStats() {
        if (!this.state.char|| !this.state.sheet) {
            return <Loading>Stats</Loading>;
        }

        var baseStyle = {
            textAlign: "right",
            paddingLeft: 5,
            minWidth: "2em"
        };
        var effStyle = { fontWeight: "bold" };
        effStyle = Object.assign(effStyle, baseStyle);
        var statStyle = { fontWeight: "bold" };

        var rows, derivedRows, expendable;

        var stats = ["fit", "ref", "lrn", "int", "psy", "wil", "cha",
            "pos"];
        rows = stats.map((st, ii) => {
            return <StatRow stat={st}
                            key={ii}
                            initialChar={this.state.char}
                            initialSheet={this.state.sheet}
                            onMod={this.handleModification.bind(this)}
                            url={this.state.url} />;
        });


        derivedRows = <tbody>
            <tr>
                <td style={statStyle}>MOV</td>
                <td style={baseStyle}>{this.baseMOV()}</td>
                <td style={effStyle}>{this.effMOV()}</td>
            </tr>
            <tr>
                <td style={statStyle}>DEX</td>
                <td style={baseStyle}>{this.baseDEX()}</td>
                <td style={effStyle}>{this.effDEX()}</td>
            </tr>
            <tr>
                <td style={statStyle}>IMM</td>
                <td style={baseStyle}>{this.baseIMM()}</td>
                <td style={effStyle}>{this.effIMM()}</td>
            </tr>
        </tbody>;

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

            expendable = <tbody>
                <tr><td style={statStyle}>B</td>
                    <td style={baseStyle}>{this.baseBody()}{toughness}</td>
                    <td style={recoveryStyle}>{this.bodyHealing()}</td></tr>
                <tr><td style={statStyle}>S</td>
                    <td style={baseStyle}>{this.stamina()}</td>
                    <td style={recoveryStyle}>{this.staminaRecovery()}</td></tr>
                <tr><td style={statStyle}>M</td>
                    <td style={baseStyle}>{this.mana()}</td>
                    <td style={recoveryStyle}>{this.manaRecovery()}</td></tr>
            </tbody>;

        return <div style={{position: "relative", width: "18em"}}>
            <h4>Stats</h4>
            <table>
                <tbody>
                {rows}
                </tbody>
                {derivedRows}
            </table>
            <div style={{position: "absolute", bottom: 0, right:0}}>
                <table>
                    {expendable}
                </table>
            </div>
        </div>;
    }

    renderAdvancingInitiatives () {
        if (!this.state.char|| !this.state.sheet) {
            return <Loading>Advancing initiatives</Loading>;
        }
        return <InitiativeBlock style={{fontSize: "80%"}}
                                effMOV={this.effMOV()}
                                runMultiplier={this.runMultiplier()} />;
    }

    renderPortrait () {
        if (!this.state.char) {
            return <Loading>Portrait</Loading>;
        }

        if (this.state.char.portrait) {
            return <Image style={{maxWidth: 300}}
                                  src={this.state.char.portrait} rounded />;
        } else {
            var editURL = `/characters/edit_char/${this.state.char.id}/`;
            return <div className="edit-control">
                You can add a portrait for
                your character in the <a href={editURL}> base character edit</a>.
            </div>;
        }
    }

    renderXPControl() {
        if (!this.state.char || !this.state.edgeList) {
            return <Loading>XP</Loading>
        }

        return <XPControl
            url={this.state.url} edgesBought={this.state.edgesBought}
            initialChar={this.state.char}
            onMod={this.handleXPMod.bind(this)} />;
    }

    renderSPControl() {
        if (!this.state.char) {
            return <Loading>SP</Loading>
        }

        var ageSP = util.roundup(this.baseStat('lrn')/15 +
            this.baseStat('int')/25 + this.baseStat('psy')/50);
        return <AddSPControl
            initialAgeSP={ageSP}
            onAdd={(sp) => this.handleAddGainedSP(sp)} />;
    }

    getSkillHandler() {
        if (!this.state.characterSkills || !this.state.allSkills ||
            !this.state.edgeList) {
            return null;
        }
        return new SkillHandler({
            characterSkills: this.state.characterSkills,
            allSkills: this.state.allSkills,
            edges: this.state.edgeList,
            stats: this.getEffStats()
        });
    }

    renderFirearms() {
        var skillHandler = this.getSkillHandler();
        if (!this.state.firearmList || !skillHandler) {
            return <Loading>Firearms</Loading>;
        }
        var rows = [];

        var idx = 0;
        for (let fa of this.state.firearmList) {
            if (idx % 2 === 0) {
                var bgColor = "transparent";
            } else {
                bgColor = "rgb(245, 245, 255)";
            }
            rows.push(<FirearmControl
                key={idx++} weapon={fa}
                skillHandler={skillHandler}
                onRemove={(fa) => this.handleFirearmRemoved(fa) }
                style={{fontSize: "80%", backgroundColor: bgColor}}
            />);
        }

        return <Panel header={<h4>Firearms</h4>}>
            {rows}

            <AddFirearmControl campaign={this.state.char.campaign}
            onFirearmAdd={(fa) => this.handleFirearmAdded(fa) }/>
        </Panel>;
    }

    renderCCWeapons() {
        var skillHandler = this.getSkillHandler();
        if (!this.state.weaponList || !skillHandler) {
            return <Loading>Close-combat weapons</Loading>;
        }

        var rows = [];

        var idx = 0;

        for (let wpn of this.state.weaponList) {
            if (idx % 2 === 0) {
                var bgColor = "transparent";
            } else {
                bgColor = "rgb(245, 245, 255)";
            }

            rows.push(<WeaponRow
                key={idx++} weapon={wpn}
                skillHandler={skillHandler}
                onRemove={(wpn) => this.handleWeaponRemoved(wpn) }
                style={{fontSize: "80%", backgroundColor: bgColor}}
            />);
        }

        return <Panel header={<h4>Close combat</h4>}>
            {rows}
            <AddWeaponControl campaign={this.state.char.campaign}
            onAdd={(fa) => this.handleWeaponAdded(fa) }/>

        </Panel>;

    }

    renderRangedWeapons() {
        var skillHandler = this.getSkillHandler();
        if (!this.state.rangedWeaponList || !skillHandler) {
            return <Loading>Ranged weapons</Loading>;
        }

        var rows = [];

        var idx = 0;

        for (let wpn of this.state.rangedWeaponList) {
            if (idx % 2 === 0) {
                var bgColor = "transparent";
            } else {
                bgColor = "rgb(245, 245, 255)";
            }

            rows.push(<RangedWeaponRow
                key={idx++} weapon={wpn}
                skillHandler={skillHandler}
                onRemove={(wpn) => this.handleRangedWeaponRemoved(wpn) }
                style={{fontSize: "80%", backgroundColor: bgColor}}
            />);
        }

        return <Panel header={<h4>Ranged weapons</h4>}>
            {rows}
            <AddRangedWeaponControl campaign={this.state.char.campaign}
                              onAdd={
                              (rw) => this.handleRangedWeaponAdded(rw) }/>
        </Panel>;

    }

    render() {
        var description = this.renderDescription(),
            skillTable = this.renderSkills(),
            notes = this.renderNotes(),
            stats = this.renderStats(),
            initiativeBlock = this.renderAdvancingInitiatives(),
            portrait = this.renderPortrait(),
            xpControl = this.renderXPControl(),
            spControl = this.renderSPControl();

        return (
            <Grid>
                <Col md={8}>
                    <Row>
                        <Col md={6}>
                            <Row>
                                {description}
                            </Row>
                            <Row>
                                {stats}
                                {xpControl}
                                {spControl}
                            </Row>
                        </Col>
                        <Col md={6}>
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
                    </Row>
                    <Row>
                        {this.renderCCWeapons()}
                    </Row>
                    <Row>
                        {this.renderFirearms()}
                    </Row>
                    <Row>
                        {this.renderRangedWeapons()}
                    </Row>
                </Col>
                <Col md={4}>
                    {skillTable}
                </Col>
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
