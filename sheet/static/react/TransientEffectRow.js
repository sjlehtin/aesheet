import React from 'react';
var util = require('sheet-util');
import {Col, Row, Button} from 'react-bootstrap';
import Octicon from 'react-octicon';

class TransientEffectRow extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        var effects = [];
        var idx = 0;
        for (let st of Object.keys(this.props.effect.effect)) {
            // Skip certain fields with special handling.
            if (["description", "notes", "name", "type", "tech_level"
                ].indexOf(st) >= 0) {
                continue;
            }
            var value = this.props.effect.effect[st];
            var rendered = '';
            if (util.isInt(value)) {
                rendered = util.renderInt(value);
            } else if (util.isFloat(value)) {
                if (parseFloat(value) == 0.0) {
                    continue;
                }
                rendered = value;
            } else  {
                rendered = value;
            }
            var color = 'red';
            if (value > 0) {
                color = 'blue';
            }
            if (value) {
                effects.push(
                    <span style={{paddingRight: 5, fontWeight: "bold",
                        color: color}} key={idx++}>
                        {st.toUpperCase()} {rendered}</span>);
            }
        }

        return <tr style={this.props.style}
                   title={this.props.effect.effect.description}>
            <td>
            {this.props.effect.effect.name}
                <span style={{marginLeft: 10}}>
                {effects}
                </span>
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
