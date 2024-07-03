import React from 'react';
import PropTypes from 'prop-types';

import {Button, Modal} from 'react-bootstrap';
import StatRow from './StatRow';
import StatBreakdown from "./StatBreakdown";
import NoteBlock from './NoteBlock';
import InitiativeBlock from './InitiativeBlock';
import Loading from './Loading';
import FirearmControl from './FirearmControl';
import WeaponRow from './WeaponRow';
import RangedWeaponRow from './RangedWeaponRow';
import SkillHandler from './SkillHandler';
import ArmorControl from './ArmorControl';
import DamageControl from './DamageControl';
import SenseTable from './SenseTable';

import {
    Card,
    Col,
    Row,
} from 'react-bootstrap';

const rest = require('./sheet-rest');
const util = require('./sheet-util');

class CompactSheet extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            loading: true,
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

            gravity: 1.0,

            carriedInventoryWeight: 0,

            armor: undefined,
            helm: undefined,

            showDamages: false,

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

    async changeArmor(armor, url, finalizer) {
        let data;
        if ('id' in armor) {
            data = {item: armor.id};
        } else {
            data = {
                base: armor.base.name,
                quality: armor.quality.name
            };
        }
        const json = await rest.post(url, data)
        armor.id = json.id;
        armor.name = json.name;
        finalizer(armor);
    }

    async handleArmorChanged(armor) {
        const finalizer = (item) => { this.setState({armor: item}); };

        if (armor === null) {
            await rest.del(this.getArmorURL(this.state.armor));
            finalizer({})
            return;
        }
        await this.changeArmor(armor, this.getArmorURL(), finalizer);
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
        return rest.patch(this.props.url + `wounds/${woundId}/`,
            data).then((json) => {
            let index = CompactSheet.findItemIndex(
                this.state.woundList, data);
            let wound = Object.assign(this.state.woundList[index], data);
            this.state.woundList.splice(index, 1, wound);
            this.setState({woundList: this.state.woundList});
        }).catch((err) => console.log(err));
    }

    handleWoundRemoved(data) {
        let woundId = data.id;
        return rest.del(this.props.url + `wounds/${woundId}/`).then(
            (json) => {
            let index = CompactSheet.findItemIndex(
                this.state.woundList, data);
            this.state.woundList.splice(index, 1);
            this.setState({woundList: this.state.woundList});
            }
        ).catch((err) => console.log(err));
    }

    handleWoundAdded(data) {
        return rest.post(this.props.url + `wounds/`, data).then((json) => {
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

    async componentDidMount() {
        /* TODO: Failures to load objects from the server should be indicated
           visually to the users, as well as failures to save etc.  Use an
           error-handling control for this purpose. */
        let promises = []

        const firearms = await rest.getData(this.props.url + 'sheetfirearms/')
        this.handleFirearmsLoaded(firearms)

        promises.push(rest.getData(this.props.url + 'sheetweapons/').then((json) => {
            this.handleWeaponsLoaded(json);
        }).catch((err) => {console.log("Failed to load weapons:", err)}))

        promises.push(rest.getData(this.props.url + 'sheetrangedweapons/').then((json) => {
            this.handleRangedWeaponsLoaded(json);
        }).catch((err) => {console.log("Failed to load ranged weapons:",
            err)}))

        promises.push(rest.getData(this.props.url + 'sheettransienteffects/').then((json) => {
            this.handleTransientEffectsLoaded(json);
        }).catch((err) => {console.log("Failed to load transient effects:",
            err)}))

        promises.push(rest.getData(this.props.url + 'sheetmiscellaneousitems/').then((json) => {
            this.handleMiscellaneousItemsLoaded(json);
        }).catch((err) => {console.log("Failed to load miscellaneous items:",
            err)}))

        promises.push(rest.getData(this.props.url + 'sheetarmor/').then((json) => {
            let obj = {};
            if (json.length > 0) {
                obj = json[0];
            }
            this.handleArmorLoaded(obj);
        }).catch((err) => {console.log("Failed to load armor:",
            err)}))

        promises.push(rest.getData(this.props.url + 'sheethelm/').then((json) => {
            let obj = {};
            if (json.length > 0) {
                obj = json[0];
            }
            this.handleHelmLoaded(obj);
        }).catch((err) => {console.log("Failed to load helm:",
            err)}))

        const sheet = await rest.getData(this.props.url)

        const characterUrl = `/rest/characters/${sheet.character}/`;

        this.setState({
            sheet: sheet,
            // Updates occur towards the character.
            url: characterUrl
        });

        promises.push(rest.getData(characterUrl + 'characteredges/').then(
            (characterEdges) => {
                this.handleEdgesLoaded(characterEdges);
            }).catch(function (err) {
                console.log("Failed to load edges", err)}))

        promises.push(rest.getData(characterUrl + 'wounds/').then(
            (wounds) => {
                this.handleWoundsLoaded(wounds);
            }).catch(function (err) {
                console.log("Failed to load wounds", err)}))

        const character = await rest.getData(characterUrl)
        const characterSkills = await rest.getData(characterUrl + 'characterskills/')
        const allSkills = await rest.getData(
            `/rest/skills/campaign/${character.campaign}/`)

        this.handleSkillsLoaded(characterSkills, allSkills);
        this.setState({char: character});

        await Promise.allSettled(promises)
        this.setState({loading: false})
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

        if (highStat !== 0) {
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

    async handleSheetUpdate(field, oldValue, newValue) {
        let data = this.state.sheet;

        const update = {}
        update[field] = newValue;
        const json = await rest.patch(this.props.url, update)
        data[field] = newValue;
        this.setState({sheet: data});
    }


    static findItemIndex(itemList, givenItem) {
        for (var ii = 0; ii < itemList.length; ii++) {
            var item = itemList[ii];
            if (item.id === givenItem.id) {
                return ii;
            }
        }
        throw Error("No such item", givenItem);
    }

    handleCharacterSkillRemove(skill) {
        rest.del(this.getCharacterSkillURL(skill)).then((json) => {
            let index = CompactSheet.findItemIndex(
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
            var index = CompactSheet.findItemIndex(
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

    getMagazineURL(fa, mag) {
        var baseURL = `${this.props.url}sheetfirearms/${fa.id}/magazines/`;
        if (mag) {
            return baseURL + mag.id + '/';
        } else {
            return baseURL;
        }
    }

    handleFirearmRemoved(firearm) {
        rest.del(this.getFirearmURL(firearm), firearm).then(
            (json) => {
                var index = CompactSheet.findItemIndex(
                    this.state.firearmList, firearm);
                this.state.firearmList.splice(index, 1);
                this.setState({firearmList: this.state.firearmList});
            }).catch((err) => {console.log("Error in deletion: ", err)});
    }

    async handleFirearmChanged(data) {
        let patchData = {id: data.id};
        if (data.ammo) {
            patchData.ammo = data.ammo.id;
        }

        if (data.scope) {
            patchData.scope = data.scope.id;
        } else if (data.scope === null) {
            patchData.scope = null;
        }
        patchData.use_type = data.use_type

        // Consider fetching full details from backend
        const json = await rest.patch(this.getFirearmURL(data), patchData)

        const index = CompactSheet.findItemIndex(
            this.state.firearmList, data);
        let updatedFireArm = Object.assign({}, this.state.firearmList[index],
            data);
        updatedFireArm.use_type = json.use_type
        this.state.firearmList.splice(index, 1, updatedFireArm);
        this.setState({firearmList: this.state.firearmList});
    }

    async handleMagazineRemoved(firearm, magazine) {
        await rest.del(this.getMagazineURL(firearm, magazine), magazine)
        const faIndex = CompactSheet.findItemIndex(
            this.state.firearmList, firearm);
        const magIndex = CompactSheet.findItemIndex(this.state.firearmList[faIndex].magazines, magazine)
        this.state.firearmList[faIndex].magazines.splice(magIndex, 1);
        this.setState({firearmList: this.state.firearmList});
    }

    async handleMagazineAdded(firearm, magazine) {
        const json = await rest.post(this.getMagazineURL(firearm), {capacity: magazine.capacity, current: magazine.capacity})
        let newList = this.state.firearmList.slice()
        const faIndex = CompactSheet.findItemIndex(
            newList, firearm);
        newList[faIndex].magazines.push(json);
        this.setState({firearmList: newList});
    }

    async handleMagazineChanged(firearm, magazine) {
        const json = await rest.patch(this.getMagazineURL(firearm, magazine), Object.assign({}, magazine))
        let newList = this.state.firearmList.slice()
        const faIndex = CompactSheet.findItemIndex(
            newList, firearm);
        const magIndex = CompactSheet.findItemIndex(
            newList[faIndex].magazines, magazine);
        let newMags = newList[faIndex].magazines.slice()
        newMags.splice(magIndex, 1, json);
        newList[faIndex].magazines = newMags

        await this.setState({firearmList: newList});
    }

    getWeaponURL(fa) {
        var baseURL = this.props.url + 'sheetweapons/';
        if (fa) {
            return baseURL + fa.id + '/';
        } else {
            return baseURL;
        }
    }

    handleWeaponRemoved(weapon) {
        rest.del(this.getWeaponURL(weapon), weapon).then(
            (json) => {
                var index = CompactSheet.findItemIndex(
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

    handleRangedWeaponRemoved(weapon) {
        rest.del(this.getRangedWeaponURL(weapon), weapon).then(
            (json) => {
                var index = CompactSheet.findItemIndex(
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
        return <div>
                    <NoteBlock edges={this.state.edgeList}
                        effects={this.getAllEffects()} compact={true}/>
                </div>;
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
                <td style={effStyle}><StatBreakdown label={"Stat"} value={effStats.mov} breakdown={effStats.breakdown.mov} /></td>
            </tr>
            <tr>
                <td style={statStyle}>DEX</td>
                <td style={baseStyle}>{baseStats.dex}</td>
                <td style={effStyle}><StatBreakdown label={"Stat"} value={effStats.dex} breakdown={effStats.breakdown.dex} /></td>
            </tr>
            <tr>
                <td style={statStyle}>IMM</td>
                <td style={baseStyle}>{baseStats.imm}</td>
                <td style={effStyle}><StatBreakdown label={"Stat"} value={effStats.imm} breakdown={effStats.breakdown.imm} /></td>
            </tr>
        </tbody>;

        const bodyFromToughness = skillHandler.edgeLevel("Toughness") * 2;
        let toughness;
        if (bodyFromToughness) {
            toughness = <span>+<span style={{ fontWeight: "bold"}}
                                     id={"bodyFromToughness"}
                                     aria-label={"Body from Toughness"}
            >{bodyFromToughness}</span></span>;
        } else {
            toughness = "";
        }
        var recoveryStyle = {
            color: "grey",
            paddingLeft: 5
        };

        expendable = <tbody>
        <tr><td style={statStyle}>B</td>
            <td style={baseStyle} aria-label={"Body at full health"}>{baseStats.baseBody}{toughness}</td>
            <td aria-label={"Body healing"} style={recoveryStyle}>{this.bodyHealing(skillHandler)}</td>
            <td>{skillHandler.getCurrentBody()}</td>
        </tr>
        <tr>
            <td style={statStyle}>S</td>
            <td style={baseStyle}>{baseStats.stamina}</td>
            <td aria-label={"Stamina recovery"}
                style={recoveryStyle}>{this.staminaRecovery(effStats, skillHandler)
            }</td>
            <td>{skillHandler.getCurrentStamina()}</td>
        </tr>

        <tr>
            <td style={statStyle}>M</td>
            <td style={baseStyle}
                aria-label={"Maximum mana"}>{baseStats.mana}</td>
            <td aria-label={"Mana recovery"}
                style={recoveryStyle}>{this.manaRecovery(effStats, skillHandler)
            }</td>
            <td>{skillHandler.getCurrentMana()}</td>

        </tr>
        </tbody>;

        return <div style={{position: "relative", width: "18em"}}>
            <table>
                <tbody>
                {rows}
                </tbody>
                {derivedRows}
                {expendable}
            </table>
        </div>;
    }

    renderAdvancingInitiatives (skillHandler) {
        if (!skillHandler) {
            return <Loading>Advancing initiatives</Loading>;
        }
        return <InitiativeBlock className="m-1"
                                style={{fontSize: "80%"}}
                                distance={this.props.toRange}
                                stats={skillHandler} />;
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
            weightCarried: this.getCarriedWeight().value,
            staminaDamage: this.state.sheet.stamina_damage,
            gravity: this.props.gravity,
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

    getCarriedWeight() {
        let breakdown = []
        let weight = 0
        if (this.state.armor && this.state.armor.base) {
            const itemWeight = util.itemWeight(this.state.armor)
            weight += itemWeight
            breakdown.push(
                {
                    reason: "armor",
                    value: itemWeight
                }
            )
        }
        if (this.state.helm && this.state.helm.base) {
            const itemWeight =  util.itemWeight(this.state.helm)
            weight += itemWeight
            breakdown.push(
                {
                    reason: "helm",
                    value: itemWeight
                }
            )
        }

        let weaponWeight = 0
        for (let wpn of this.state.weaponList) {
            weaponWeight += util.itemWeight(wpn)
        }
        weight += weaponWeight
        if (weaponWeight) {
            breakdown.push(
                {
                    reason: "CC weapons",
                    value: weaponWeight
                }
            )
        }

        let rangedWeaponWeight = 0
        for (let wpn of this.state.rangedWeaponList) {
            rangedWeaponWeight += util.itemWeight(wpn)
        }
        weight += rangedWeaponWeight
        if (weaponWeight) {
            breakdown.push(
                {
                    reason: "ranged weapons",
                    value: rangedWeaponWeight
                }
            )
        }

        let firearmWeight = 0
        let ammoWeight = 0
        for (let wpn of this.state.firearmList) {
            firearmWeight += parseFloat(wpn.base.weight);
            if (wpn.scope) {
                firearmWeight += parseFloat(wpn.scope.weight)
            }
            // TODO: addons
            for (const mag of wpn.magazines) {
                ammoWeight += util.magazineWeight(wpn, mag)
            }
        }
        weight += firearmWeight
        if (weaponWeight) {
            breakdown.push(
                {
                    reason: "firearms",
                    value: firearmWeight
                }
            )
        }

        weight += ammoWeight
        if (ammoWeight) {
            breakdown.push(
                {
                    reason: "ammunition",
                    value: ammoWeight
                }
            )
        }

        let miscellaneousItemWeight = 0
        for (let item of this.state.miscellaneousItemList) {
            miscellaneousItemWeight += parseFloat(item.item.weight);
        }
        weight += miscellaneousItemWeight
        if (miscellaneousItemWeight) {
            breakdown.push(
                {
                    reason: "miscellaneous items",
                    value: miscellaneousItemWeight
                }
            )
        }

        weight += this.state.carriedInventoryWeight
        if (this.state.carriedInventoryWeight) {
            breakdown.push(
                {
                    reason: "inventory",
                    value: this.state.carriedInventoryWeight
                }
            )
        }

        const extraFromGravity = weight * (this.props.gravity - 1.0)
        if (extraFromGravity) {
            weight += extraFromGravity
            breakdown.push(
                {
                    reason: "gravity",
                    value: extraFromGravity
                }
            )
        }

        return {
            value: weight,
            breakdown: breakdown
        }
    }

    renderFirearms(skillHandler) {
        if (this.state.loading) {
            return <Loading>Firearms</Loading>;
        }
        var rows = [];

        var idx = 0;
        const baseStyle = {fontSize: "80%"}
        for (let fa of this.state.firearmList) {
            let bgColor
            if (idx % 2 === 0) {
                bgColor = "transparent"
            } else {
                bgColor = "rgb(245, 245, 255, 0.4)"
            }
            rows.push(<FirearmControl
                key={idx++} weapon={fa}
                skillHandler={skillHandler}
                onRemove={(fa) => this.handleFirearmRemoved(fa) }
                onChange={async (data) => await this.handleFirearmChanged(data)}
                onMagazineRemove={async (mag) => await this.handleMagazineRemoved(fa, mag)}
                onMagazineAdd={async (mag) => await this.handleMagazineAdded(fa, mag)}
                onMagazineChange={async (mag) => await this.handleMagazineChanged(fa, mag)}
                campaign={this.state.char.campaign}
                style={Object.assign({}, baseStyle, {backgroundColor: bgColor})}
                toRange={this.props.toRange}
                darknessDetectionLevel={this.props.darknessDetectionLevel}
            />);
        }

        return <div>
            {rows}
            </div>
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

        return <div>
            {rows}
            </div>
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
                gravity={this.props.gravity}
            />);
        }

        return <div>
            {rows}
        </div>

    }

    renderArmor(skillHandler) {
        if (this.state.loading) {
            return <Loading>Armor</Loading>;
        }
        return <ArmorControl
                campaign={this.state.char.campaign}
                armor={this.state.armor}
                helm={this.state.helm}
                handler={skillHandler}
                miscellaneousItems={this.state.miscellaneousItemList}
                style={{fontSize: "80%"}}
                />
    }

    renderDamages(skillHandler) {
        if (!skillHandler) {
            return <Loading>Damage controls</Loading>;
        }
        return <DamageControl
                character={skillHandler.props.character}
                sheet={this.state.sheet}
                handler={skillHandler}
                wounds={this.state.woundList}
                onWoundMod={this.handleWoundChanged.bind(this)}
                onWoundRemove={this.handleWoundRemoved.bind(this)}
                onWoundAdd={this.handleWoundAdded.bind(this)}
                onMod={this.handleSheetUpdate.bind(this)}
            />;
    }

    renderSenseTable(handler) {
        if (!handler) {
            return <Loading>Senses</Loading>
        }

        return <SenseTable handler={handler}/>;
    }

    renderWeightCarried () {
        if (this.state.loading) {
            return <Loading>Inventory</Loading>
        }
        const weight = this.getCarriedWeight()
        return <span>Weight carried: <span aria-label={"Weight carried"}>
            <StatBreakdown style={{display: "inline-block"}} label={"Encumbrance"} toFixed={2} units={" kg"} value={Number.parseFloat(weight.value)} breakdown={weight.breakdown} /></span></span>
    }

    render() {
        const skillHandler = this.getSkillHandler();

        const statusMap = new Map([
            [SkillHandler.STATUS_OK, "bg-success-subtle"],
            [SkillHandler.STATUS_WOUNDED, "bg-warning-subtle"],
            [SkillHandler.STATUS_CRITICAL, "bg-danger-subtle"]
        ])

        const statusClass = skillHandler ? `${statusMap.get(skillHandler.getStatus())}` : "";

        const title = this.state.char ? `${this.state.char.name} ${this.state.char.total_xp} XP` : ''

        return (
            <>
                      <Modal size="lg" show={this.state.showDamages} onHide={() => {this.setState(
                          {showDamages: false}
                      )}}>
        <Modal.Header closeButton>
          <Modal.Title>{title} damages</Modal.Title>
        </Modal.Header>
        <Modal.Body>{this.renderDamages(skillHandler)}</Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={() => {this.setState(
                          {showDamages: false}
                      )}}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
            <Card className={`m-0 ${statusClass}`}>
                <Card.Header>
                    <Row fluid={"true"}>
                        <Col xs={5}>
                    <h4>{title ? <a href={`/sheets/${this.state.sheet.id}/`}>{title}</a> : <Loading>Character</Loading>}{' '}{this.state.sheet?.description} {`(id: ${this.state.sheet?.id})`}</h4>
                        </Col>
                        <Col xs={2}><Button size={"sm"} onClick={() => {this.setState(
                          {showDamages: true}
                      )}}>Damage</Button></Col>
                        <Col fluid={"true"} className="d-flex justify-content-end">
                            {this.props.children}
                        </Col>
                    </Row>
                </Card.Header>
            <Card.Body className={"p-0"}>
                <Col>
                    <Row>
                        <Col>
                            <Row>
                                {this.renderDescription()}
                            </Row>
                            <Row>
                                {this.renderStats(skillHandler)}
                            </Row>
                            <Row>
                                <Col>{this.renderWeightCarried()}</Col>
                            </Row>
                            <Row>
                                <Col>
                                {this.renderNotes()}
                                </Col>
                            </Row>
                        </Col>
                        <Col>
                            <Row>
                                <Col>
                                 {this.renderArmor(skillHandler)}
                                    </Col>
                                </Row>
                            <Row>
                                <Col>
                                {this.renderAdvancingInitiatives(skillHandler)}
                                </Col>
                            </Row>
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
                </Col>
            </Card.Body>
            </Card>
            </>
        )
    }
}

CompactSheet.propTypes = {
    url: PropTypes.string.isRequired,
    toRange: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
    darknessDetectionLevel: PropTypes.number.isRequired,
    gravity: PropTypes.number.isRequired,
    onCharacterSkillAdd: PropTypes.func,
    onCharacterSkillRemove: PropTypes.func,
    onCharacterSkillModify: PropTypes.func
};

export default CompactSheet;
