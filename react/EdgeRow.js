import React, {useId} from 'react';

import PropTypes from 'prop-types';

const util = require('./sheet-util');
import {Button} from 'react-bootstrap';
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

        // It is unnecessary and possibly harmful to send all the
        // data back about the EdgeLevel details, so removing them from the
        // removal and change REST payloads.
        let deletePayload = Object.assign({}, this.props.edge);
        delete deletePayload.edge;

        //const inputId = useId();
        const inputId = `ignoreCostLabel-${this.props.edge.id}`

        return <tr style={this.props.style}
                   title={this.props.edge.edge.edge.description}>
            <td>
                {this.props.edge.edge.edge.name} {this.props.edge.edge.level}
            </td>
            <td>
                <span style={{color: "red"}}>{this.props.edge.edge.cost}</span>
            </td>
            <td>
                {costIgnored}
                <span><label htmlFor={inputId}>Ignore cost</label>
                    <input ref={(c) => this._toggleIgnoreCost = c}
                           tabIndex={0}
                           onChange={(e) => {this.props.onChange(Object.assign(deletePayload, {ignore_cost: !deletePayload.ignore_cost}))}}
                           checked={this.props.edge.ignore_cost}
                           // readOnly={true}
                           id={inputId} type={"checkbox"} value={this.props.edge.ignore_cost}/></span>
            </td>
            <td>
                <Button style={{float: "right",
                paddingRight: 5}}
                        size={"sm"}
                      ref={(c) => this._removeButton = c }
                      onClick={(e) => {this.props.onRemove(deletePayload)}}
                >Remove</Button>
            </td>
        </tr>;
    }
}

EdgeRow.propTypes = {
    edge: PropTypes.object.isRequired,
    onRemove: PropTypes.func,
    onChange: PropTypes.func
};

export default EdgeRow;
