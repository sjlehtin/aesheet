import React from 'react';

var rest = require('sheet-rest');

//<div class="xp">
//<label>XP:</label> {{ sheet.xp_used_stats }} +
//{% if sheet.hero %}
//{{ sheet.xp_used_hero }} +
//{% endif %}
//{{ sheet.xp_used_edges }} +
//{{ sheet.xp_used_ingame }} = {{ sheet.xp_used }} / {{ sheet.total_xp}}
//
//<div class="edit-control">
//    <form action="{{ act }}" method="post">
//        {% csrf_token %}
//        {{ add_xp_form }}
//        <input type="submit" value="Add XP" />
//    </form>
//</div>
//</div>
//</div>

class XPControl extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
        };
    }

    static calculateStatRaises (char) {
        var sum = 0;
        ["fit", "ref", "lrn", "int", "psy", "wil", "cha",
            "pos"].forEach((stat) => {
            sum += parseInt(char["cur_" + stat]) -
                parseInt(char["start_" + stat]);
        });
        sum += char.bought_mana;
        sum += char.bought_stamina;

        return sum;
    };

    render() {
        var totalXP = 0;
        var xpStatsBought = XPControl.calculateStatRaises(this.props.initialChar) * 5;
        totalXP += xpStatsBought;
        var xpEdgesBought = this.props.edgesBought * 25;
        totalXP += xpEdgesBought;
        totalXP += this.props.initialChar.xp_used_ingame;

        var hero;

        if (this.props.initialChar.hero) {
            hero = <span title="Hero">100 + </span>;
            totalXP += 100;
        }
        var stat = {fontWeight: "bold", paddingRight: 5};
        var xpWarning = "";
        if (totalXP > this.props.initialChar.total_xp) {
            xpWarning = <div style={{color: "red"}}>Too much XP used!</div>;
        }
        return (<div><span style={stat}>XP:</span>
            <span title="Stats, stamina and mana bought">{xpStatsBought} + </span>
            {hero}
            <span title="Edges bought {this.props.edgesBought}">{xpEdgesBought} + </span>
            <span title="XP used ingame">{this.props.initialChar.xp_used_ingame}</span>
            <span> = {totalXP} /
                {this.props.initialChar.total_xp}</span>{xpWarning}
        </div>);
    }
}

XPControl.propTypes = {
    url: React.PropTypes.string.isRequired,
    edgesBought: React.PropTypes.number.isRequired,
    initialChar: React.PropTypes.object.isRequired,
    onMod: React.PropTypes.func
};

export default XPControl;
