import React from 'react';

var rest = require('sheet-rest');

class StatRow extends React.Component {
    constructor(props) {
        super(props);
        /* TODO: next phase, expose the stat calculation to
           the JavaScript completely.  Calculate weights in JS, pass spell
           effects, item effects, etc. to JS.  This allows creating a UI where
           hovering over the stat allows to show a breakdown where the stat
           bonuses and penalties are coming from, in real time. */
        var stat = this.props.stat.toLowerCase();
        this.state = {
            stat: stat,
            cur: this.props.initialChar["cur_" + stat],
            hard_mod: this.props.initialChar["mod_" + stat],
            soft_mod: this.props.initialSheet["mod_" + stat],
            showEditControls: false
        };
    }

    handleModification(event, amount) {
        event.stopPropagation();
        /* TODO: the many places in need of update highlights the fact that
           the derived attributes should perhaps not be part of the state. */
        var oldValue = this.state.cur;
        var newValue = this.state.cur + amount;

        // Optimistic update.
        this.setState({
            cur: newValue
        });

        /* TODO: throttling updates to server, maybe wait a
           moment before sending?  */
        var data = {};
        data['cur_' + this.state.stat] = newValue;
        rest.patch(this.props.url, data).catch(function (reason) {
            this.setState({cur: oldValue});
            console.log("Failed to update char:", reason);
        });
    }

    handleIncrease(event) {
        this.handleModification(event, 1);
    }

    handleDecrease(event) {
        this.handleModification(event, -1);
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
            ///paddingLeft: 5,
            minWidth: "2em"
        };
        var effStyle = { fontWeight: "bold" };
        effStyle = Object.assign(effStyle, baseStyle);
        var statStyle = { fontWeight: "bold" };
        var controlStyle = {
            visibility: this.state.showEditControls ? "visible" : "hidden",
            fontWeight: "bold"
        };
        var incStyle = {
            color: "green",
            paddingLeft: 5,
            cursor: "pointer",
            fontSize: "150%",

            // No selection of the text on double click.
            MozUserSelect: "none",
            WebkitUserSelect: "none",
            msUserSelect: "none"
        };
        var decStyle = {};
        decStyle = Object.assign(decStyle, incStyle);
        decStyle.color = "red";

        var change = this.state.cur
            - this.props.initialChar["start_" + this.state.stat];
        var base = this.state.cur + this.state.hard_mod;
        return (
            <tr onMouseEnter={this.handleMouseEnter.bind(this)}
                onMouseLeave={this.handleMouseOut.bind(this)}
                onTouchEnd={this.handleTouchEnd.bind(this)}>
                <td style={statStyle}>{this.props.stat.toUpperCase()}</td>
                <td style={baseStyle}>{base}</td>
                <td style={effStyle}>{base + this.state.soft_mod}</td>
                <td style={changeStyle}>
                    ({change >= 0 ? "+" : ""}{change})
                </td>
                {/* Tap here should not make the controls disappear. */}
                <td onTouchEnd={(e) => e.stopPropagation()}>
                    <span style={controlStyle}>
                        <span ref={(c) => this._increaseButton = c }
                              style={incStyle}
                              onClick={this.handleIncrease.bind(this)}>+</span>
                        <span ref={(c) => this._decreaseButton = c }
                              style={decStyle}
                              onClick={this.handleDecrease.bind(this)}>-</span>
                    </span>
                </td>
            </tr>)
    }
}

StatRow.propTypes = {
    stat: React.PropTypes.string.isRequired,
    initialChar: React.PropTypes.object.isRequired,
    initialSheet: React.PropTypes.object.isRequired,
    url: React.PropTypes.string.isRequired
};

export default StatRow;
