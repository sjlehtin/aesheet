import React from 'react';
var util = require('sheet-util');
import {Col, Row, Button} from 'react-bootstrap';
import Octicon from 'react-octicon';

class MiscellaneousItemRow extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {

        return <tr style={this.props.style}
                   title={this.props.item.item.description}>
            <td>
            {this.props.item.item.name}
                <span style={{marginLeft: 10}}>
                </span>
            <span style={{color: "red", cursor: "pointer", float: "right",
            paddingRight: 5}}
                  ref={(c) => this._removeButton = c }
                  onClick={(e) => {this.props.onRemove(this.props.item)}}
            ><Octicon name="x" /></span>
                </td>
        </tr>;
    }
}

MiscellaneousItemRow.props = {
    item: React.PropTypes.object.isRequired,
    onRemove: React.PropTypes.func
};

export default MiscellaneousItemRow;
