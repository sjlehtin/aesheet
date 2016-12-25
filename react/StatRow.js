import React from 'react';
import Octicon from 'react-octicon';

var rest = require('./sheet-rest');

class StatRow extends React.Component {
    constructor(props) {
        super(props);
        /* TODO: next phase, expose the stat calculation to
           the JavaScript completely.  Calculate weights in JS, pass spell
           effects, item effects, etc. to JS.  This allows creating a UI where
           hovering over the stat allows to show a breakdown where the stat
           bonuses and penalties are coming from, in real time. */
        /* TODO: Move stat update towards backend to StatBlock. */
        var stat = this.props.stat.toLowerCase();
        this.state = {
            stat: stat,
            cur: this.props.initialChar["cur_" + stat],
            showEditControls: false,
            updating: false
        };
    }

    handleModification(event, amount) {
        event.stopPropagation();

        if (this.state.updating) {
            console.log("waiting server to respond to last event...")
            return Promise.resolve({});
        }
        this.setState({updating: true})

        var oldValue = this.state.cur;
        var newValue = this.state.cur + amount;

        // Optimistic update.
        this.setState({
            cur: newValue
        });

        /* TODO: throttling updates to server, maybe wait a
           moment before sending?

           If user clicks the add/remove buttons multiple times per second, the
           results are unpredictable.
        */
        var data = {};
        data['cur_' + this.state.stat] = newValue;

        // TODO: this should be handled in StatBlock.
        return rest.patch(this.props.url, data).then((response) => {
            this.setState({updating: false});
            if (this.props.onMod) {
                this.props.onMod(this.state.stat, oldValue, newValue);
            }
        }).catch((reason) => {
            this.setState({cur: oldValue, updating: false});
        });
    }

    handleIncrease(event) {
        return this.handleModification(event, 1);
    }

    handleDecrease(event) {
        return this.handleModification(event, -1);
    }

    handleTouchEnd(event) {
        /* mouse enter/leave to display the controls does not work on pads or
           phones.  Instead, we'll use a tap to indicate whether the edit
           controls should be made visible. */
        this.setState({showEditControls: !this.state.showEditControls});
    }

    handleMouseEnter(event) {
        this.setState({showEditControls: true});
    }

    handleMouseOut(event) {
        this.setState({showEditControls: false});
    }

    render() {

        var changeStyle = {
            color: "#a9a9a9",
            fontSize: "80%",
            minWidth: "2.5em"
        };

        var baseStyle = {
            textAlign: "right",
            padding: 0,
            ///paddingLeft: 5,
            minWidth: "2em"
        };
        var effStyle = { fontWeight: "bold" };
        effStyle = Object.assign(effStyle, baseStyle);
        var statStyle = { fontWeight: "bold" };


        var controlStyle = {
            visibility: this.state.showEditControls ? "visible" : "hidden",
            fontWeight: "bold",
            position: "relative",
            width: "3em"
        };

        var incStyle = {
            color: "green", position: "absolute", left: 8, bottom: -5, cursor: "pointer",

            // No selection of the text on double click.
            MozUserSelect: "none",
            WebkitUserSelect: "none",
            msUserSelect: "none"
        };
        var decStyle = Object.assign({}, incStyle);
        decStyle = Object.assign(decStyle, {color: "red", left: 19, bottom: -9});

        var change = this.state.cur
            - this.props.initialChar["start_" + this.state.stat];

        return (
            <tr onMouseEnter={this.handleMouseEnter.bind(this)}
                onMouseLeave={this.handleMouseOut.bind(this)}
                onTouchEnd={this.handleTouchEnd.bind(this)}>
                <td style={statStyle}>{this.props.stat.toUpperCase()}</td>
                <td style={baseStyle}>{this.props.baseStats[this.props.stat]}</td>
                <td style={effStyle}>{this.props.effStats[this.props.stat]}</td>
                <td style={changeStyle}>
                    ({change >= 0 ? "+" : ""}{change})
                </td>
                {/* Tap here should not make the controls disappear. */}
                <td onTouchEnd={(e) => e.stopPropagation()}>
                    <div style={controlStyle}>
                        <span style={incStyle}
                              ref={(c) => this._increaseButton = c}
                              onClick={(e) => {return this.handleIncrease(e)}}
                        ><Octicon name="arrow-up" /></span>
                        <span style={decStyle}
                              ref={(c) => this._decreaseButton = c}
                              onClick={(e) => {return this.handleDecrease(e)}}
                        ><Octicon name="arrow-down" /></span>
                    </div>
                </td>
            </tr>)
    }
}

StatRow.propTypes = {
    stat: React.PropTypes.string.isRequired,
    initialChar: React.PropTypes.object.isRequired,
    effStats: React.PropTypes.object.isRequired,
    baseStats: React.PropTypes.object.isRequired,
    url: React.PropTypes.string.isRequired,
    onMod: React.PropTypes.func
};

export default StatRow;
