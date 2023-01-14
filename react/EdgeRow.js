import React from 'react';
import PropTypes from 'prop-types';

const util = require('./sheet-util');
import Octicon from 'react-octicon';

class EdgeRow extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        let costIgnored;
        if (this.props.edge.ignore_cost) {
            costIgnored = <span style={{color: "blue", fontStyle: "italic"}}>Cost ignored</span>;
        } else {
            costIgnored = "";
        }

        return <tr style={this.props.style}
                   title={this.props.edge.edge.edge.description}>
            <td>
            {this.props.edge.edge.edge.name} {this.props.edge.edge.level}
                <span style={{marginLeft: 10}}>
                </span>
                <span style={{color: "red"}}>{this.props.edge.edge.cost}</span>
                {costIgnored}
            <span style={{color: "red", cursor: "pointer", float: "right",
            paddingRight: 5}}
                  ref={(c) => this._removeButton = c }
                  onClick={(e) => {this.props.onRemove(this.props.edge)}}
            ><Octicon name="x" /></span>
                </td>
        </tr>;
    }
}

EdgeRow.propTypes = {
    edge: PropTypes.object.isRequired,
    onRemove: PropTypes.func
};

export default EdgeRow;
