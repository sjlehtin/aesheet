import React from 'react';
import ReactDOM from 'react-dom';
import { Button, Input } from 'react-bootstrap';
import AddArmorControl from 'AddArmorControl';
var util = require('sheet-util');

class ArmorControl extends React.Component {
    constructor(props) {
        super(props);
        this.state = {editing: false};
    }

    getArmorStat(location, type) {
        var stat = 0;
        var accessor = `armor_${location.toLowerCase()}_${type.toLowerCase()}`;
        var quality = `armor_${type.toLowerCase()}`;

        var getFieldValue = function(field) {
            if (field) {
                return parseFloat(field);
            }
            return 0;
        }
        if (this.props.armor && this.props.armor.base) {
            stat += getFieldValue(this.props.armor.base[accessor]);
            if (location !== "H") {
                stat += getFieldValue(this.props.armor.quality[quality]);
            }
        }
        if (this.props.helm && this.props.helm.base) {
            stat += getFieldValue(this.props.helm.base[accessor]);
            if (location === "H") {
                stat += getFieldValue(this.props.helm.quality[quality]);
            }
        }

        for (let item of this.props.miscellaneousItems) {
            for (let ql of item.item.armor_qualities) {
                    stat += getFieldValue(ql[accessor]);
            }
        }
        return stat;
    }

    render() {
        var addControls = '';
        var buttonText = 'Edit';
        if (this.state.editing) {
            addControls = <div>
                <AddArmorControl
                    tag="Helmet"
                    onChange={(value) => this.props.onHelmChange(value) }
                    campaign={this.props.campaign} />
                <AddArmorControl onChange={(value) => this.props.onArmorChange(value) }
                                 campaign={this.props.campaign} />
                <div><a href="/sheets/add_armor/">Create a new armor</a>
                    <a href="/sheets/add_armor_template/">Create a new armortemplate</a>
                    <a href="/sheets/add_armor_quality/">Create new quality</a>
                    <a href="/sheets/add_armor_special_quality/">Create new special quality</a>
                </div>
            </div>;
            buttonText = 'Close';
        }
        var armors = [];
        if (this.props.helm && this.props.helm.name) {
            armors.push(this.props.helm.name);
        }
        if (this.props.armor && this.props.armor.name) {
            armors.push(this.props.armor.name)
        }

        var armorStats = [];

        var cellStyle = {minWidth: "2em"};

        armorStats.push(<thead key={"thead"}><tr><th>d8</th><th>Loc</th>
             <th>P</th><th>S</th><th>B</th><th>R</th><th>DR</th><th>DP</th>
             <th>PL</th></tr></thead>);
        var locations = [];
        var dice = { H: "8", T: "5-7", RA: "4", RL: "3", LA: "2", LL: "1"};
        for (let loc of ["H", "T", "RA", "RL", "LA", "LL"]) {
            var row = [];
            row.push(<td style={cellStyle} key={loc + "-1"}>{dice[loc]}</td>);
            row.push(<td style={cellStyle} key={loc + "-2"}>{loc}</td>);
            for (let col of ["P", "S", "B", "R", "DR", "DP", "PL"]) {
                row.push(<td style={cellStyle} key={loc + '-' + col}>
                    { util.rounddown(this.getArmorStat(loc, col)) }
                </td>);
            }
            locations.push(<tr key={loc}>{row}</tr>);
        }
        armorStats.push(<tbody key={0}>{locations}</tbody>);

        return <div><div>{armors.join(', ')}
            <Button ref={(c) => this._editButton = c} onClick={
                () => this.setState({editing: !this.state.editing})}>Edit</Button>
        </div>
            <div>
            {addControls}
            </div>
            <table>{armorStats}</table>
        </div>;
    }
}

ArmorControl.propTypes = {
    tag: React.PropTypes.string,
    armor: React.PropTypes.object,
    helm: React.PropTypes.object,
    miscellaneousItems: React.PropTypes.arrayOf(React.PropTypes.object),
    effects: React.PropTypes.arrayOf(React.PropTypes.object),
    campaign: React.PropTypes.number.isRequired,
    onHelmChange: React.PropTypes.func,
    onArmorChange: React.PropTypes.func
};

ArmorControl.defaultProps = {miscellaneousItems: []}
export default ArmorControl;
