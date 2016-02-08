/* props: edges, list of edges,
 * effects:  A collection of effects on the character of type statmodifier
 * character: The initial character.
 */

class StatHandler {
    constructor(props) {
        this.props = props;

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
                this._softMods[st] += mod.effect[st];
            }
        }
        this._baseStats = undefined;
        this._effStats = undefined;
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
                    this._hardMods[st];
            }
            this._baseStats.mov = Math.round((this._baseStats.fit + 
                this._baseStats.ref)/2) + this._hardMods.mov;
            this._baseStats.dex = Math.round((this._baseStats.int + 
                this._baseStats.ref)/2) + this._hardMods.dex;
            this._baseStats.imm = Math.round((this._baseStats.fit + 
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
            this._effStats.mov = Math.round((this._effStats.fit + 
                this._effStats.ref)/2) + this._hardMods.mov +
                this._softMods.mov;
            this._effStats.dex = Math.round((this._effStats.int + 
                this._effStats.ref)/2) + this._hardMods.dex +
                this._softMods.dex;
            this._effStats.imm = Math.round((this._baseStats.fit +
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


export default StatHandler;