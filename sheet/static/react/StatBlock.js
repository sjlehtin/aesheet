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

    render() {
        var rows;
        console.log("char:", this.state.char);
        if (typeof(this.state.char) === "undefined") {
            rows = <tr><td>Loading...</td></tr>;
        } else {
            var stats = ["fit", "ref", "lrn", "int", "psy", "wil", "cha",
                "pos"];
            rows = stats.map(function(st, ii) {
                return <StatRow stat={st}
                                key={ii}
                                initialChar={this.state.char}
                                initialSheet={this.state.sheet}
                                url={this.state.url} />;
            }.bind(this));
        }
        console.log("wat?");
        return (
            <div>
                <h4>Stats</h4>
                <table>
                    <tbody>
                    {rows}
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
