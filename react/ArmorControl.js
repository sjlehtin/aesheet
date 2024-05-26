import React from 'react';
import PropTypes from 'prop-types';
import { Button, Col, Row } from 'react-bootstrap';

import AddArmorControl from './AddArmorControl';
const util = require('./sheet-util');

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
        };
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
        if (this.state.editing) {
            addControls = <div>
                <Button onClick={() => {this.props.onHelmChange(null)}}
                    disabled={
                            !(this.props.helm ? this.props.helm.id : 0)}>
                    Remove helmet</Button>
                <Button onClick={() => this.props.onArmorChange(null)}
                        disabled={
                            !(this.props.armor ? this.props.armor.id : 0)}>
                    Remove armor</Button>

                <AddArmorControl
                    tag="Helmet"
                    onChange={(value) => this.props.onHelmChange(value) }
                    campaign={this.props.campaign} />
                <AddArmorControl onChange={(value) => this.props.onArmorChange(value) }
                                 campaign={this.props.campaign} />
                <div><a href="/sheets/add_armor/">Create a new armor</a>{' '}
                    <a href="/sheets/add_armor_template/">Create a new armortemplate</a>{' '}
                    <a href="/sheets/add_armor_quality/">Create new quality</a>{' '}
                    <a href="/sheets/add_armor_special_quality/">Create new special quality</a>
                </div>
            </div>;
        }
        var armors = [];
        if (this.props.helm && this.props.helm.name) {
            armors.push(this.props.helm.name);
        }
        if (this.props.armor && this.props.armor.name) {
            armors.push(this.props.armor.name)
        }

        var armorStats = [];

        var headerStyle = {textAlign: "center", minWidth: "2.5em"};
        var cellStyle = { minWidth: "2.5em", textAlign: "center", border: "1px dotted black" };
        var descStyle = Object.assign({fontWeight: "bold"}, cellStyle);

        var headerCells = ["d8", "Loc", "P", "S", "B", "R", "DR", "DP",
            "PL", "Threshold"].map((el, ii) => {
            return <th style={headerStyle} key={ii}>{el}</th>;});

        armorStats.push(<thead style={headerStyle} key={"thead"}>
            <tr>{headerCells}</tr></thead>);
        var locations = [];
        var dice = { H: "8", T: "5-7", RA: "4", RL: "3", LA: "2", LL: "1"};
        for (let loc of ["H", "T", "RA", "RL", "LA", "LL"]) {
            var row = [];
            row.push(<td style={descStyle} key={loc + "-1"}>{dice[loc]}</td>);
            row.push(<td style={descStyle} key={loc + "-2"}>{loc}</td>);
            for (let col of ["P", "S", "B", "R", "DR", "DP", "PL"]) {
                row.push(<td style={cellStyle} key={loc + '-' + col}>
                    { util.rounddown(this.getArmorStat(loc, col)) }
                </td>);
            }
            row.push(<td style={{fontWeight: "bold", textAlign: "center"}} key={loc + "Threshold"}>{this.props.handler?.getDamageThreshold(loc)}</td>)
            locations.push(<tr key={loc}>{row}</tr>);
        }
        armorStats.push(<tbody key={0}>{locations}</tbody>);

        let editButtonName = "Edit Armor"
        if (this.state.editing) {
            editButtonName = "Close edit"
        }

        return <div style={this.props.style}>
            <Row>
                <Col>
                    <Row>
                        <Col>Helmet</Col><Col><span aria-label={"Current helmet"}>{this.props.helm?.name}</span></Col>
                    </Row>
                    <Row>
                        <Col>Armor</Col><Col
                        aria-label={"Current armor"}>{this.props.armor?.name}</Col>
                    </Row>
                </Col>
                <Col>
                    <Button onClick={
                        () => this.setState({editing: !this.state.editing})}>{editButtonName}</Button>
                </Col>
            </Row>
            <Row>
                {addControls}
            </Row>
            <table>{armorStats}</table>
        </div>;
    }
}

ArmorControl.propTypes = {
    tag: PropTypes.string,
    armor: PropTypes.object,
    helm: PropTypes.object,
    handler: PropTypes.object,
    miscellaneousItems: PropTypes.arrayOf(PropTypes.object),
    effects: PropTypes.arrayOf(PropTypes.object),
    campaign: PropTypes.number.isRequired,
    onHelmChange: PropTypes.func,
    onArmorChange: PropTypes.func
};

ArmorControl.defaultProps = {miscellaneousItems: []}
export default ArmorControl;
