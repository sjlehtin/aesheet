import React from 'react';
var util = require('sheet-util');
import {Col, Row, Button} from 'react-bootstrap';
import Octicon from 'react-octicon';

class EdgeRow extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {

        return <tr style={this.props.style}
                   title={this.props.edge.edge.edge.description}>
            <td>
            {this.props.edge.edge.edge.name} {this.props.edge.edge.level}
                <span style={{marginLeft: 10}}>
                </span>
            <span style={{color: "red", cursor: "pointer", float: "right",
            paddingRight: 5}}
                  ref={(c) => this._removeButton = c }
                  onClick={(e) => {this.props.onRemove(this.props.edge)}}
            ><Octicon name="x" /></span>
                </td>
        </tr>;
    }
}

EdgeRow.props = {
    edge: React.PropTypes.object.isRequired,
    onRemove: React.PropTypes.func
};

export default EdgeRow;
