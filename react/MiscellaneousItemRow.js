import React from 'react';
import PropTypes from 'prop-types';

import {GoX} from 'react-icons/go';

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
            ><GoX /></span>
                </td>
        </tr>;
    }
}

MiscellaneousItemRow.props = {
    item: PropTypes.object.isRequired,
    onRemove: PropTypes.func
};

export default MiscellaneousItemRow;
