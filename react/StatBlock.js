import React from 'react';
import PropTypes from 'prop-types';

import StatRow from './StatRow';
import XPControl from './XPControl';
import AddSPControl from './AddSPControl';
import NoteBlock from './NoteBlock';
import InitiativeBlock from './InitiativeBlock';
import SkillTable from './SkillTable';
import Loading from './Loading';
import FirearmControl from './FirearmControl';
import AddFirearmControl from './AddFirearmControl';
import WeaponRow from './WeaponRow';
import RangedWeaponRow from './RangedWeaponRow';
import AddWeaponControl from './AddWeaponControl';
import AddRangedWeaponControl from './AddRangedWeaponControl';
import TransientEffectRow from './TransientEffectRow';
import AddTransientEffectControl from './AddTransientEffectControl';
import SkillHandler from './SkillHandler';
import Inventory from './Inventory';
import ArmorControl from './ArmorControl';
import MiscellaneousItemRow from './MiscellaneousItemRow';
import AddMiscellaneousItemControl from './AddMiscellaneousItemControl';
import EdgeRow from './EdgeRow';
import AddCharacterEdgeControl from './AddCharacterEdgeControl';
import CharacterNotes from './CharacterNotes';
import MovementRates from './MovementRates';
import DamageControl from './DamageControl';
import SenseTable from './SenseTable';
import RangeControl from './RangeControl';

import {Container, Row, Col, Table, Image, Card, Badge} from 'react-bootstrap';

const rest = require('./sheet-rest');
const util = require('./sheet-util');

/**
 * TODO: controls to add bought_mana, bought_stamina, change
 * portrait, adventures, times wounded.
 */
class StatBlock extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            sheet: undefined,
            char: undefined,
            edgeList: [],

            characterEdges: [],
            characterSkills: [],
            allSkills: [],

            firearmList: [],
            weaponList: [],
            rangedWeaponList: [],
            transientEffectList: [],
            miscellaneousItemList: [],

            carriedInventoryWeight: 0,

            armor: undefined,
            helm: undefined,

            woundList: [],

            // Apply range on firearms.
            firearmRange: ""
        };
    }

    handleFirearmsLoaded(firearmList) {
        this.setState({firearmList: firearmList});
    }

    handleWeaponsLoaded(weapons) {
        this.setState({weaponList: weapons});
    }

    handleRangedWeaponsLoaded(weapons) {
        this.setState({rangedWeaponList: weapons});
    }

    handleTransientEffectsLoaded(effects) {
        this.setState({transientEffectList: effects});
    }

    handleMiscellaneousItemsLoaded(items) {
        this.setState({miscellaneousItemList: items});
    }

    handleSkillsLoaded(skillList, allSkills) {
        this.setState({characterSkills: skillList,
        allSkills: allSkills});
    }

    getArmorURL(item) {
        let baseURL = this.props.url + 'sheetarmor/';
        if (item) {
            return baseURL + item.id + '/';
        } else {
            return baseURL;
        }
    }

    handleArmorLoaded(armor) {
        this.setState({armor: armor})
    }

    changeArmor(armor, url, finalizer) {
        let data;
        if ('id' in armor) {
            data = {item: armor.id};
        } else {
            data = {
                base: armor.base.name,
                quality: armor.quality.name
            };
        }
        rest.post(url, data).then((json) => {
            armor.id = json.id;
            armor.name = json.name;
            finalizer(armor);
        }).catch((err) => {
            console.log("error", err)
        });
    }

    handleArmorChanged(armor) {
        var finalizer = (item) => { this.setState({armor: item}); };

        if (armor === null) {
            rest.del(this.getArmorURL(this.state.armor)).then(function (json) {
                finalizer({});
            }).catch((err) => {console.log("error", err)});
            return;
        }
        this.changeArmor(armor, this.getArmorURL(), finalizer);
    }

    getHelmURL(item) {
        let baseURL = this.props.url + 'sheethelm/';
        if (item) {
            return baseURL + item.id + '/';
        } else {
            return baseURL;
        }
    }

    handleHelmLoaded(helm) {
        this.setState({helm: helm})
    }

    handleHelmChanged(armor) {
        let finalizer = (helm) => {this.setState({helm: helm});};
        if (armor === null) {
            rest.del(this.getHelmURL(this.state.helm)).then(function (json) {
                finalizer({});
            }).catch((err) => {console.log("error", err)});
            return;
        }
        this.changeArmor(armor, this.getHelmURL(), finalizer);
    }

    handleEdgesLoaded(characterEdges) {
        this.setState({
            characterEdges: characterEdges,
            edgeList: characterEdges.map(
                (charEdge) => {return charEdge.edge})
        });
    }

    handleWoundsLoaded(wounds) {
        this.setState({woundList: wounds})
    }

    handleWoundChanged(data) {
        let woundId = data.id;
        return rest.patch(this.state.url + `wounds/${woundId}/`,
            data).then((json) => {
            let index = StatBlock.findItemIndex(
                this.state.woundList, data);
            let wound = Object.assign(this.state.woundList[index], data);
            this.state.woundList.splice(index, 1, wound);
            this.setState({woundList: this.state.woundList});
        }).catch((err) => console.log(err));
    }

    handleWoundRemoved(data) {
        let woundId = data.id;
        return rest.del(this.state.url + `wounds/${woundId}/`).then(
            (json) => {
            let index = StatBlock.findItemIndex(
                this.state.woundList, data);
            this.state.woundList.splice(index, 1);
            this.setState({woundList: this.state.woundList});
            }
        ).catch((err) => console.log(err));
    }

    handleWoundAdded(data) {
        return rest.post(this.state.url + `wounds/`, data).then((json) => {
            this.state.woundList.push(json);
            this.setState({woundList: this.state.woundList});
        }).then((err) => console.log(err));
    }

    getCharacterEdgeURL(edge) {
        let baseURL = this.state.url + 'characteredges/';
        if (edge) {
            return baseURL + edge.id + '/';
        } else {
            return baseURL;
        }
    }

    handleEdgeAdded(data) {
        // push data via REST, update characterEdges and regenerate
        // edgeList.
        rest.post(this.getCharacterEdgeURL(), {edge: data.id}).then((json) => {
            let ce = Object.assign({}, json, {edge: data});
            let newList = this.state.edgeList;
            newList.push(data);
            let newCEList = this.state.characterEdges;
            newCEList.push(ce);
            this.setState({
                edgeList: newList,
                characterEdges: newCEList
            });
        }).catch((err) =>
            console.log("Failed adding edge to character:", err));
    }

    handleEdgeRemoved(givenEdge) {
        console.log("Removed: ", givenEdge);
        rest.del(this.getCharacterEdgeURL(givenEdge)).then((json) => {
            let index = StatBlock.findItemIndex(
                this.state.characterEdges, givenEdge);
            this.state.characterEdges.splice(index, 1);
            this.handleEdgesLoaded(this.state.characterEdges);
        }).catch((err) => console.log(err));
    }

    componentDidMount() {
        /* TODO: Failures to load objects from the server should be indicated
           visually to the users, as well as failures to save etc.  Use an
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

        rest.getData(this.props.url + 'sheettransienteffects/').then((json) => {
            this.handleTransientEffectsLoaded(json);
        }).catch((err) => {console.log("Failed to load transient effects:",
            err)});

        rest.getData(this.props.url + 'sheetmiscellaneousitems/').then((json) => {
            this.handleMiscellaneousItemsLoaded(json);
        }).catch((err) => {console.log("Failed to load miscellaneous items:",
            err)});

        rest.getData(this.props.url + 'sheetarmor/').then((json) => {
            let obj = {};
            if (json.length > 0) {
                obj = json[0];
            }
            this.handleArmorLoaded(obj);
        }).catch((err) => {console.log("Failed to load armor:",
            err)});

        rest.getData(this.props.url + 'sheethelm/').then((json) => {
            let obj = {};
            if (json.length > 0) {
                obj = json[0];
            }
            this.handleHelmLoaded(obj);
        }).catch((err) => {console.log("Failed to load helm:",
            err)});

        rest.getData(this.props.url).then((sheet) => {

            this.setState({
                sheet: sheet,
                // Updates occur towards the character.
                url: `/rest/characters/${sheet.character}/`
            });

            rest.getData(this.state.url + 'characteredges/').then(
                (characterEdges) => {
                    this.handleEdgesLoaded(characterEdges);
                }).catch(function (err) {
                    console.log("Failed to load edges", err)});

            rest.getData(this.state.url + 'wounds/').then(
                (wounds) => {
                    this.handleWoundsLoaded(wounds);
                }).catch(function (err) {
                    console.log("Failed to load wounds", err)});

            rest.getData(this.state.url)
                .then((character) => {
                    rest.getData(this.state.url + 'characterskills/').then(
                        (characterSkills) => {
                            rest.getData(
                                `/rest/skills/campaign/${character.campaign}/`)
                                .then((allSkills) => {
                                    this.handleSkillsLoaded(characterSkills,
                                    allSkills);
                                }).catch((err) => {
                                console.log("Failed load: ", err)});
                        }).catch(function (err) {
                            console.log("Failed CS load", err)});
                    this.setState({char: character});
                });

        });
    }

    mana(baseStats) {
        return util.roundup((baseStats.psy + baseStats.wil)/ 4)
            + this.state.char.bought_mana;
    }

    bodyHealing(skillHandler) {
        let level = skillHandler.edgeLevel("Fast Healing");
        if (level > 0) {
            let _lookupFastHealing = {
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

    staminaRecovery(effStats, skillHandler) {
        /* High stat: ROUNDDOWN((IMM-45)/15;0)*/
        var highStat = util.rounddown((effStats.imm - 45)/15);
        var level = skillHandler.edgeLevel("Fast Healing");

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

    manaRecovery(effStats, skillHandler) {
        /* High stat: 2*ROUNDDOWN((CHA-45)/15;0)*/
        var highStat = 2*util.rounddown((effStats.cha - 45)/15);
        var level = skillHandler.edgeLevel("Fast Mana Recovery");

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
            return "";
        }
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
        }).catch((err) => console.log("Failed skill add:", err));
    }

    handleAddGainedSP(addedSP) {
        let data = this.state.char,
            newGained = data.gained_sp + addedSP;

        rest.patch(this.state.url, {gained_sp: newGained}).then((json) => {
            data.gained_sp = newGained;
            this.setState({char: data});
        }).catch((err) => console.log("Failed adding gained sp:", err));
    }

    /* TODO:  I think this is the best way to handle the update.  The
       sub-components request the update from the character, which does the
       actual rest call and propagates the update back downward.  Handling
       API call failures can then be handled by sending messages from
       here in a unified manner. */
    handleCharacterUpdate(field, oldValue, newValue) {
        var data = this.state.char;

        var update = {};
        update[field] = newValue;
        return rest.patch(this.state.url, update).then((json) => {
            data[field] = newValue;
            this.setState({char: data});
        }).catch((err) => console.log(err));
    }


    static findItemIndex(itemList, givenItem) {
        for (var ii = 0; ii < itemList.length; ii++) {
            var item = itemList[ii];
            if (item.id === givenItem.id) {
                return ii;
            }
        }
        throw Error("No such item: " + givenItem);
    }

    handleCharacterSkillRemove(skill) {
        rest.del(this.getCharacterSkillURL(skill)).then((json) => {
            let index = StatBlock.findItemIndex(
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
        rest.del(this.getFirearmURL(firearm), firearm).then(
            (json) => {
                var index = StatBlock.findItemIndex(
                    this.state.firearmList, firearm);
                this.state.firearmList.splice(index, 1);
                this.setState({firearmList: this.state.firearmList});
            }).catch((err) => {console.log("Error in deletion: ", err)});
    }

    handleFirearmChanged(data) {
        let patchData = {id: data.id};
        if (data.ammo) {
            patchData.ammo = data.ammo.id;
        }

        if (data.scope) {
            patchData.scope = data.scope.id;
        } else if (data.scope === null) {
            patchData.scope = null;
        }

        return rest.patch(this.getFirearmURL(data), patchData).then(() => {
            const index = StatBlock.findItemIndex(
                this.state.firearmList, data);
            let updatedFireArm = Object.assign({}, this.state.firearmList[index],
                data);
            this.state.firearmList.splice(index, 1, updatedFireArm);
            this.setState({firearmList: this.state.firearmList});
        }).catch(err => {console.log("Error updating firearm: ", err)});
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
            data = {item: weapon.id};
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
        rest.del(this.getWeaponURL(weapon), weapon).then(
            (json) => {
                var index = StatBlock.findItemIndex(
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
            data = {item: weapon.id};
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
        rest.del(this.getRangedWeaponURL(weapon), weapon).then(
            (json) => {
                var index = StatBlock.findItemIndex(
                    this.state.rangedWeaponList, weapon);
                this.state.rangedWeaponList.splice(index, 1);
                this.setState({rangedWeaponList:
                this.state.rangedWeaponList});
            }).catch((err) => {console.log("Error in deletion: ", err)});
    }

    getTransientEffectURL(eff) {
        var baseURL = this.props.url + 'sheettransienteffects/';
        if (eff) {
            return baseURL + eff.id + '/';
        } else {
            return baseURL;
        }
    }

    handleTransientEffectAdded(data) {
        var effect = {effect: data};
        console.log("Adding: ", effect);
        rest.post(this.getTransientEffectURL(), {effect: data.name}).then((json) => {
            console.log("POST success", json);
            effect.id = json.id;
            var newList = this.state.transientEffectList;
            newList.push(effect);
            this.setState({transientEffectList: newList});
        }).catch((err) => {console.log("error", err)});
    }

    handleTransientEffectRemoved(effect) {
        rest.del(this.getTransientEffectURL(effect), effect).then(
            (json) => {
                var index = StatBlock.findItemIndex(
                    this.state.transientEffectList, effect);
                this.state.transientEffectList.splice(index, 1);
                this.setState({transientEffectList:
                  this.state.transientEffectList});
            }).catch((err) => {console.log("Error in deletion: ", err)});
    }

    getMiscellaneousItemURL(eff) {
        var baseURL = this.props.url + 'sheetmiscellaneousitems/';
        if (eff) {
            return baseURL + eff.id + '/';
        } else {
            return baseURL;
        }
    }

    handleMiscellaneousItemAdded(data) {
        var item = {item: data};
        console.log("Adding: ", item);
        rest.post(this.getMiscellaneousItemURL(), {item: data.id}).then((json) => {
            console.log("POST success", json);
            item.id = json.id;
            var newList = this.state.miscellaneousItemList;
            newList.push(item);
            this.setState({miscellaneousItemList: newList});
        }).catch((err) => {console.log("error", err)});
    }

    handleMiscellaneousItemRemoved(item) {
        rest.del(this.getMiscellaneousItemURL(item), item).then(
            (json) => {
                var index = StatBlock.findItemIndex(
                    this.state.miscellaneousItemList, item);
                this.state.miscellaneousItemList.splice(index, 1);
                this.setState({miscellaneousItemList:
                  this.state.miscellaneousItemList});
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
        return <Card>
            <Card.Header><h4>Notes</h4></Card.Header>
            <Card.Body>
                    <NoteBlock edges={this.state.edgeList}
                        effects={this.getAllEffects()} />
            </Card.Body>
        </Card>;
    }

    renderSkills(skillHandler) {
        if (!skillHandler) {
            return <Loading>Skills</Loading>
        }
        return <SkillTable
            style={{fontSize: "80%"}}
            skillHandler={skillHandler}
            onCharacterSkillRemove={
                      (skill) => this.handleCharacterSkillRemove(skill)}
            onCharacterSkillModify={
                      (skill) => this.handleCharacterSkillModify(skill)}
            onCharacterSkillAdd={
                      (skill) => this.handleCharacterSkillAdd(skill)}
            />
    }

    renderStats(skillHandler) {
        if (!skillHandler) {
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

        var baseStats = skillHandler.getBaseStats();
        var effStats = skillHandler.getEffStats();

        var stats = ["fit", "ref", "lrn", "int", "psy", "wil", "cha",
            "pos"];
        rows = stats.map((st, ii) => {
            /* TODO: hard and soft mods should be passed here. */
            return <StatRow stat={st}
                            key={ii}
                            initialChar={this.state.char}
                            baseStats={baseStats}
                            effStats={effStats}
                            onMod={this.handleModification.bind(this)}
                            url={this.state.url} />;
        });


        derivedRows = <tbody>
            <tr>
                <td style={statStyle}>MOV</td>
                <td style={baseStyle}>{baseStats.mov}</td>
                <td style={effStyle}>{effStats.mov}</td>
            </tr>
            <tr>
                <td style={statStyle}>DEX</td>
                <td style={baseStyle}>{baseStats.dex}</td>
                <td style={effStyle}>{effStats.dex}</td>
            </tr>
            <tr>
                <td style={statStyle}>IMM</td>
                <td style={baseStyle}>{baseStats.imm}</td>
                <td style={effStyle}>{effStats.imm}</td>
            </tr>
        </tbody>;

        var toughness = skillHandler.edgeLevel("Toughness");
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
            <td style={baseStyle}>{baseStats.baseBody
            }{toughness}</td>
            <td style={recoveryStyle}>{this.bodyHealing(skillHandler)}</td></tr>
        <tr><td style={statStyle}>S</td>
            <td style={baseStyle}>{baseStats.stamina}</td>
            <td style={recoveryStyle}>{this.staminaRecovery(effStats, skillHandler)
            }</td></tr>
        <tr><td style={statStyle}>M</td>
            <td style={baseStyle}>{this.mana(baseStats)}</td>
            <td style={recoveryStyle}>{this.manaRecovery(effStats, skillHandler)
            }</td></tr>
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

    renderAdvancingInitiatives (skillHandler) {
        if (!skillHandler) {
            return <Loading>Advancing initiatives</Loading>;
        }
        return <InitiativeBlock className="m-1" style={{fontSize: "80%"}}
                                stats={skillHandler} />;
    }

    renderPortrait () {
        if (!this.state.char) {
            return <Loading>Portrait</Loading>;
        }

        if (this.state.char.portrait) {
            return <Image className={"align-middle m-1"} fluid style={{maxWidth: 300, alignSelf: "center"}}
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

        var edgesBought = 0;
        for (let edge of this.state.edgeList) {
            edgesBought += parseFloat(edge.cost);
        }
        return <XPControl
            url={this.state.url} edgesBought={edgesBought}
            initialChar={this.state.char}
            onMod={this.handleXPMod.bind(this)} />;
    }

    renderSPControl(baseStats) {
        if (!baseStats) {
            return <Loading>SP</Loading>
        }

        var ageSP = util.roundup(baseStats.lrn/15 +
            baseStats.int/25 + baseStats.psy/50);
        return <AddSPControl initialAgeSP={ageSP}
                             onAdd={(sp) => this.handleAddGainedSP(sp)} />;
    }

    getSkillHandler() {
        if (!this.state.char|| !this.state.edgeList || !this.state.armor ||
            !this.state.helm) {
            return null;
        }
        return new SkillHandler({
            character: this.state.char,
            characterSkills: this.state.characterSkills,
            allSkills: this.state.allSkills,
            edges: this.state.edgeList,
            effects: this.getAllEffects(),
            weightCarried: this.getCarriedWeight(),
            wounds: this.state.woundList,
            armor: this.state.armor,
            helm: this.state.helm
        });
    }

    getAllEffects() {
        var effects = this.state.transientEffectList.map(
            (eff) => {return eff.effect});

        var addName = function (el, name) {
            return Object.assign({}, el, {name: name})
        }
        if (this.state.armor && this.state.armor.special_qualities) {
            effects = effects.concat(this.state.armor.special_qualities.map(
                (el) => { return addName(el, this.state.armor.name) }));
        }
        if (this.state.helm && this.state.helm.special_qualities) {
            effects = effects.concat(this.state.helm.special_qualities.map(
                (el) => { return addName(el, this.state.helm.name) }));
        }
        for (let wpn of this.state.weaponList) {
            effects = effects.concat(wpn.special_qualities.map(
                (el) => { return addName(el, wpn.name) }));
        }
        for (let wpn of this.state.rangedWeaponList) {
            effects = effects.concat(wpn.special_qualities.map(
                (el) => { return addName(el, wpn.name) }));
        }
        for (let item of this.state.miscellaneousItemList) {
            effects = effects.concat(item.item.armor_qualities.map(
                (el) => { return addName(el, item.item.name) }));
            effects = effects.concat(item.item.weapon_qualities.map(
                (el) => { return addName(el, item.item.name) }));
        }
        return effects;
    }

    inventoryWeightChanged(newWeight) {
        this.setState({carriedInventoryWeight: newWeight});
    }

    getCarriedWeight() {
        var weight = 0;
        if (this.state.armor && this.state.armor.base) {
            weight += parseFloat(this.state.armor.base.weight) *
            parseFloat(this.state.armor.quality.mod_weight_multiplier);
        }
        if (this.state.helm && this.state.helm.base) {
            weight += parseFloat(this.state.helm.base.weight) *
            parseFloat(this.state.helm.quality.mod_weight_multiplier);
        }

        for (let wpn of this.state.weaponList){
            weight += parseFloat(wpn.base.weight) *
                parseFloat(wpn.quality.weight_multiplier);
        }

        for (let wpn of this.state.rangedWeaponList){
            weight += parseFloat(wpn.base.weight) *
                parseFloat(wpn.quality.weight_multiplier);
        }

        for (let wpn of this.state.firearmList){
            weight += parseFloat(wpn.base.weight);
        }

        for (let item of this.state.miscellaneousItemList){
            weight += parseFloat(item.item.weight);
        }

        return weight + this.state.carriedInventoryWeight;
    }

    rangeChanged(newRange) {
        this.setState({firearmRange: newRange.range,
                       firearmDarknessDetectionLevel: newRange.darknessDetectionLevel});
    }

    renderFirearms(skillHandler) {
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
                onChange={(data) => this.handleFirearmChanged(data)}
                campaign={this.state.char.campaign}
                style={{fontSize: "80%", backgroundColor: bgColor}}
                toRange={this.state.firearmRange}
                darknessDetectionLevel={this.state.firearmDarknessDetectionLevel}
            />);
        }

        return <Card>
            <Card.Header>
                <h4>Firearms</h4>
            </Card.Header>
            <Card.Body>
                <RangeControl onChange={(e) => this.rangeChanged(e)}/>
            </Card.Body>
            <Card.Body className={"table-responsive p-0 m-1"}>
            {rows}
            </Card.Body>
            <Card.Footer>
            <AddFirearmControl campaign={this.state.char.campaign}
                onFirearmAdd={(fa) => this.handleFirearmAdded(fa) }/>
            </Card.Footer>
        </Card>;
    }

    renderCCWeapons(skillHandler) {
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

        return <Card>
            <Card.Header>
                <h4>Close combat</h4>
            </Card.Header>
            <Card.Body className={"table-responsive p-0"}>
            {rows}
            </Card.Body>
            <Card.Footer>
            <AddWeaponControl campaign={this.state.char.campaign}
            onAdd={(fa) => this.handleWeaponAdded(fa) }/>
            </Card.Footer>
        </Card>;

    }

    renderRangedWeapons(skillHandler) {
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

        return <Card>
            <Card.Header>
                <h4>Ranged weapons</h4>
            </Card.Header>
            <Card.Body className={"table-responsive p-0"}>
            {rows}
            </Card.Body>
            <Card.Footer>
            <AddRangedWeaponControl campaign={this.state.char.campaign}
                              onAdd={
                              (rw) => this.handleRangedWeaponAdded(rw) }/>
            </Card.Footer>
        </Card>;

    }

    renderTransientEffects() {
        if (!this.state.transientEffectList || !this.state.char) {
            return <Loading>Transient effects</Loading>;
        }

        var rows = [];

        var idx = 0;

        for (let eff of this.state.transientEffectList) {
            rows.push(<TransientEffectRow
                key={idx++}
                effect={eff}
                onRemove={(eff) => this.handleTransientEffectRemoved(eff) }
            />);
        }

        return <Card>
            <Card.Header>
                <h4>Transient effects</h4>
            </Card.Header>
            <Card.Body className={"table-responsive p-0"}>
            <Table striped>
                <thead>
                <tr><th>Effect</th></tr>
                </thead>
                <tbody>
                {rows}
                </tbody>
            </Table>
            </Card.Body>
            <Card.Footer>
                <AddTransientEffectControl
                    campaign={this.state.char.campaign}
                    onAdd={(eff) => this.handleTransientEffectAdded(eff) }/>
            </Card.Footer>
        </Card>;
    }

    renderMiscellaneousItems() {
        if (!this.state.miscellaneousItemList || !this.state.char) {
            return <Loading>Miscellaneous items</Loading>;
        }

        var rows = [];

        var idx = 0;

        for (let item of this.state.miscellaneousItemList) {
            rows.push(<MiscellaneousItemRow
                key={idx++}
                item={item}
                onRemove={(item) => this.handleMiscellaneousItemRemoved(item) }
            />);
        }

        return <Card>
            <Card.Header>
                <h4>Miscellaneous items</h4>
            </Card.Header>
            <Card.Body className={"table-responsive p-0 m-1"}>
            <Table striped>
                <thead>
                <tr><th>Item</th></tr>
                </thead>
                <tbody>
                {rows}
                </tbody>
            </Table>
            </Card.Body>
            <Card.Footer>
                <AddMiscellaneousItemControl
                    campaign={this.state.char.campaign}
                    onAdd={(eff) => this.handleMiscellaneousItemAdded(eff) }/>
            </Card.Footer>
        </Card>;
    }

    renderEdges() {
        if (!this.state.edgeList || !this.state.char) {
            return <Loading>Edges</Loading>;
        }

        var rows = [];

        var idx = 0;

        for (let item of this.state.characterEdges) {
            rows.push(<EdgeRow
                key={idx++}
                edge={item}
                onRemove={(item) => this.handleEdgeRemoved(item) }
            />);
        }

        return <Card>
            <Card.Body>
                <h4>Edges</h4>
            </Card.Body>
            <Card.Body className={"table-responsive p-0 m-1"}>
            <Table striped>
                <thead>
                <tr><th>Edge</th></tr>
                </thead>
                <tbody>
                {rows}
                </tbody>
            </Table>
            </Card.Body>
            <Card.Footer>
                <AddCharacterEdgeControl
                    campaign={this.state.char.campaign}
                    onAdd={(edge) => this.handleEdgeAdded(edge) }/>
            </Card.Footer>
        </Card>;
    }

    renderInventory() {
        return <Inventory url={this.props.url + "inventory/"}
                          onWeightChange={ (newWeight) => this.inventoryWeightChanged(newWeight) }/>;
    }

    renderCharacterNotes() {
        if (!this.state.char) {
            return <Loading>Notes</Loading>;
        }
        return <CharacterNotes url={`/rest/characters/${this.state.char.id}/`}/>;
    }

    renderArmor() {
        if (!this.state.char || !this.state.armor || !this.state.helm) {
            return <Loading>Armor</Loading>;
        }
        return <Card>
            <Card.Header>
                <h4>Armor</h4>
            </Card.Header>
            <Card.Body className={"table-responsive"}>
            <ArmorControl
                campaign={this.state.char.campaign}
                armor={this.state.armor}
                helm={this.state.helm}
                miscellaneousItems={this.state.miscellaneousItemList}
                onHelmChange={(value) => this.handleHelmChanged(value)}
                onArmorChange={(value) => this.handleArmorChanged(value)}
                style={{fontSize: "80%"}}
                />
            </Card.Body>
            </Card>;
    }

    renderMovementRates(skillHandler) {
        if (!skillHandler) {
            return <Loading>Movement rates</Loading>;
        }
        return <MovementRates skillHandler={skillHandler} />;
    }

    renderDamages(skillHandler) {
        if (!skillHandler) {
            return <Loading>Damage controls</Loading>;
        }
        return <DamageControl
                character={skillHandler.props.character}
                handler={skillHandler}
                wounds={this.state.woundList}
                onWoundMod={this.handleWoundChanged.bind(this)}
                onWoundRemove={this.handleWoundRemoved.bind(this)}
                onWoundAdd={this.handleWoundAdded.bind(this)}
                onMod={this.handleCharacterUpdate.bind(this)}
            />;
    }

    renderHeader() {
        if (!this.state.char || !this.state.sheet) {
            return <Loading>Header</Loading>;
        }

        var privateNotification = '';
        if (this.state.char.private) {
            privateNotification = <Badge variant="danger">Private</Badge>;
        }

        return <Row>
                <Col><h1>{this.state.char.name}</h1></Col>
                <Col><a href={`/characters/edit_char/${this.state.char.id}/`}>Edit base character</a></Col>
                <Col><a href={`/characters/edit_sheet/${this.state.sheet.id}/`}>Edit base sheet</a></Col>
                <Col><a href={`/sheets/copy/${this.state.sheet.id}`}>Copy this sheet</a></Col>
                <Col>
                    <Card>
                    <Card.Header>
                        <h4>Owner</h4>
                    </Card.Header>
                        <Card.Body>
                        <span style={{marginRight: "1em"}}>{this.state.sheet.owner}</span>
                        {privateNotification}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>;
    }

    renderSenseTable(handler) {
        if (!handler) {
            return <Loading>Senses</Loading>
        }

        return <SenseTable handler={handler}/>;
    }

    render() {
        var skillHandler = this.getSkillHandler();
        if (skillHandler) {
            var baseStats = skillHandler.getBaseStats();
            var effStats = skillHandler.getEffStats();
        }

        return (
            <Container fluid={true}>
                {this.renderHeader()}
                <Row>
                <Col md={8}>
                    <Row>
                        <Col md={6}>
                            <Row>
                                {this.renderDescription()}
                            </Row>
                            <Row>
                                {this.renderStats(skillHandler)}
                                {this.renderXPControl()}
                                {this.renderSPControl(baseStats)}
                            </Row>
                            <Row>
                                Weight carried: {this.getCarriedWeight().toFixed(2)} kg
                            </Row>
                            <Row style={{fontSize: "60%"}}>
                                {this.renderSenseTable(skillHandler)}
                            </Row>
                        </Col>
                        <Col md={6}>
                            <Row>
                                {this.renderPortrait()}
                            </Row>
                            <Row>
                                {this.renderNotes()}
                            </Row>
                            <Row>
                                {this.renderAdvancingInitiatives(skillHandler)}
                            </Row>
                        </Col>
                    </Row>
                    <Row>
                        <Col md={6}>
                            {this.renderArmor()}
                        </Col>
                        <Col md={6} style={{fontSize: "60%"}}>
                            {this.renderMovementRates(skillHandler)}
                        </Col>
                    </Row>
                    <Row>
                        <Col>
                        {this.renderDamages(skillHandler)}
                        </Col>
                    </Row>
                    <Row>
                        <Col>
                        {this.renderCCWeapons(skillHandler)}
                        </Col>
                    </Row>
                    <Row>
                        <Col>
                        {this.renderFirearms(skillHandler)}
                        </Col>
                    </Row>
                    <Row>
                        <Col>
                        {this.renderRangedWeapons(skillHandler)}
                        </Col>
                    </Row>
                    <Row>
                        <Col>
                        {this.renderEdges()}
                        </Col>
                    </Row>
                    <Row>
                        <Col>
                        {this.renderMiscellaneousItems()}
                        </Col>
                    </Row>
                    <Row>
                        <Col>
                        {this.renderTransientEffects()}
                        </Col>
                    </Row>
                    <Row>
                        <Col>
                        {this.renderInventory()}
                        </Col>
                    </Row>
                    <Row>
                        <Col>
                        {this.renderCharacterNotes()}
                        </Col>
                    </Row>
                </Col>
                <Col md={4}>
                    {this.renderSkills(skillHandler)}
                </Col>
                </Row>
            </Container>
        )
    }
}

StatBlock.propTypes = {
    url: PropTypes.string.isRequired,
    onCharacterSkillAdd: PropTypes.func,
    onCharacterSkillRemove: PropTypes.func,
    onCharacterSkillModify: PropTypes.func
};

export default StatBlock;
