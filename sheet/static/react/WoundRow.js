import React from 'react';
import ReactDOM from 'react-dom';
import { Button, Modal, Input, ButtonInput } from 'react-bootstrap';
import Octicon from 'react-octicon'
import SkillHandler from 'SkillHandler';

var util = require('sheet-util');
var rest = require('sheet-rest');

class WoundRow extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        var inputStyle = {width: "3em"};
        return <tr style={this.props.style}>
            <td>{this.props.wound.location}</td>
            <td>{this.props.wound.damage}</td>
            <td>{this.props.wound.healed}</td>
            <td>{this.props.wound.effect}</td>
        </tr>;
    }
}

WoundRow.propTypes = {
    wound: React.PropTypes.object.isRequired
};

export default WoundRow;
