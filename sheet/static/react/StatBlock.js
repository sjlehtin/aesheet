import React from 'react';

import StatRow from 'StatRow';

var rest = require('sheet-rest');

class StatBlock extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            sheet: undefined,
            char: undefined
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

    handleModification(stat, oldValue, newValue) {
        var data = this.state.char;
        data["cur_" + stat] = newValue;
        this.setState({char: data});
    }

    render() {
        var rows, derivedRows;
        if (typeof(this.state.char) === "undefined") {
            rows = <tr><td>Loading...</td></tr>;
            derivedRows = <tr><td>Loading...</td></tr>;
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
                padding: 0,
                ///paddingLeft: 5,
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
                ]

        }
        var statsStyle = {verticalAlign: "center", border: 1};

        return (
            <div>
                <h4>Stats</h4>
                <table style={statsStyle}>
                    <tbody>
                    {rows}
                    </tbody>
                    <tbody>
                    {derivedRows}
                    </tbody>
                </table>
            </div>
        )
    }
}

StatBlock.propTypes = {
    url: React.PropTypes.string.isRequired
};

export default StatBlock;
