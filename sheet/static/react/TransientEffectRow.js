import React from 'react';
var util = require('sheet-util');
import {Col, Row, Button} from 'react-bootstrap';
import Octicon from 'react-octicon';

class TransientEffectRow extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return <tr style={this.props.style}>
            <td>
            {this.props.effect.effect.name}
            <span style={{color: "red", cursor: "pointer", float: "right",
            paddingRight: 5}}
                  ref={(c) => this._removeButton = c }
                  onClick={(e) => {this.props.onRemove(this.props.effect)}}
            ><Octicon name="x" /></span>
                </td>
        </tr>;
    }
}

TransientEffectRow.props = {
    effect: React.PropTypes.object.isRequired,
    onRemove: React.PropTypes.func
};

export default TransientEffectRow;
