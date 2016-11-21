/* props: edges, list of edges,
 * effects:  A collection of effects on the character of type statmodifier
 * character: The initial character.
 */

/*
 * TODO:  Effects from TransientEffects, ArmorSpecialQualities,
 * WeaponSpecialQualities, MiscellaneousItems, and Edges should be
 * combined and added to stats, skill levels, movement etc.
 *
 * Edges affect base stats ("hard" modifier) and the rest are
 * modifiers for the effective stats ("soft" modifier).
 *
 * This should accept the collated weight and calculate effects from that.
 * Some effects of encumbrance are not directly attributable as stats,
 * though (can't run, jump, etc).
 */

var util = require('sheet-util');

class StatHandler {
    constructor(props) {
        this.props = Object.assign({}, StatHandler.defaultProps, props);

        this._hardMods = {};
        this._softMods = {};

        for (let st of StatHandler.allStatNames) {
            this._hardMods[st] = 0;
            this._softMods[st] = 0;
        }

        for (let mod of this.props.edges) {
            for (let st of StatHandler.allStatNames) {
                this._hardMods[st] += mod[st];
            }
        }

        for (let mod of this.props.effects) {
            for (let st of StatHandler.allStatNames) {
                this._softMods[st] += mod[st];
            }
        }

        for (let st of ["fit", "ref", "psy"]) {

            this._softMods[st] += this.getArmorMod(this.props.helm, st) +
                 this.getArmorMod(this.props.armor, st);
        }

        this._baseStats = undefined;
        this._effStats = undefined;
    }

    getArmorMod(armor, givenStat) {
        var mod = 0;
        var stat = "mod_" + givenStat;
        if (armor.base && stat in armor.base) {
            mod += armor.base[stat];
        }
        if (armor.quality && stat in armor.quality) {
            mod += armor.quality[stat];
        }
        return mod;
    }

    getEdgeModifier(mod) {
        // Return the sum of modifiers from edges for modifier `mod`.
        var edges = [];
        if (this.props.edges) {
            edges = this.props.edges;
        }
        return this.getEffectModifier(mod, edges);
    }

    getEffectModifier(mod, effects) {
        // Return the sum of modifiers from edges for modifier `mod`.
        if (!effects) {
            effects = this.props.effects;
            if (!effects) {
                effects = [];
            }
        }
        var sum = 0;
        for (let eff of effects) {
            sum += parseFloat(eff[mod]);
        }
        return sum;
    }

    getHardMods() {
        return this._hardMods;
    }

    getSoftMods() {
        return this._softMods;
    }
    
    getBaseStats() {
        if (!this._baseStats) {
            this._baseStats = {};
            for (let st of StatHandler.baseStatNames) {
                this._baseStats[st] = this.props.character['cur_' + st] +
                    this.props.character['base_mod_' + st] +
                    this._hardMods[st];
            }
            this._baseStats.mov = util.roundup((this._baseStats.fit +
                this._baseStats.ref)/2) + this._hardMods.mov;
            this._baseStats.dex = util.roundup((this._baseStats.int +
                this._baseStats.ref)/2) + this._hardMods.dex;
            this._baseStats.imm = util.roundup((this._baseStats.fit +
                this._baseStats.psy)/2) + this._hardMods.mov;
        }
        return this._baseStats;
    }
    
    getEffStats() {
        if (!this._effStats) {
            this._effStats = {};
            var baseStats = this.getBaseStats();
            for (let st of StatHandler.baseStatNames) {
                this._effStats[st] = baseStats[st] +
                    this._softMods[st];
            }
            // Encumbrance and armor are calculated after soft mods
            // (transient effects, such as spells) and hard mods (edges)
            // in the excel combat sheet.
            var encumbrancePenalty = util.roundup(
                (-10 * this.props.weightCarried) / this._effStats.fit);

            this._effStats.fit += encumbrancePenalty;
            this._effStats.ref += encumbrancePenalty;

            this._effStats.mov = util.roundup((this._effStats.fit +
                this._effStats.ref)/2) + this._hardMods.mov +
                this._softMods.mov;
            this._effStats.dex = util.roundup((this._effStats.int +
                this._effStats.ref)/2) + this._hardMods.dex +
                this._softMods.dex;
            this._effStats.imm = util.roundup((this._baseStats.fit +
                this._baseStats.psy)/2) + this._hardMods.imm +
                this._softMods.imm;
        }
        return this._effStats;
    }
}

StatHandler.baseStatNames = ["fit", "ref", "lrn", "int", "psy", "wil", "cha",
                "pos"];
StatHandler.allStatNames =  StatHandler.baseStatNames.concat(
    ["mov", "dex", "imm"]);

// StatHandler.props = {
//     character: React.PropTypes.object.isRequired,
//     edges: React.PropTypes.array,
//     effects: React.PropTypes.array,
//     weightCarried: React.PropTypes.number.isRequired
//};

StatHandler.defaultProps = {
    weightCarried: 0,
    armor: {},
    helm: {},
    effects: [],
    edges: []
};

export default StatHandler;