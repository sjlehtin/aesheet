import React from 'react';
import {GoArrowUp, GoArrowDown} from 'react-icons/go';
import PropTypes from 'prop-types';
import StatBreakdown from 'StatBreakdown'
const rest = require('./sheet-rest');

class StatRow extends React.Component {
    constructor(props) {
        super(props);
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

        const stat = this.props.stat.toUpperCase();
        return (
            <tr onMouseEnter={this.handleMouseEnter.bind(this)}
                onMouseLeave={this.handleMouseOut.bind(this)}
                onTouchEnd={this.handleTouchEnd.bind(this)}>
                <td style={statStyle}>{stat}</td>
                <td style={baseStyle}>{this.props.baseStats[this.props.stat]}</td>
                <td style={effStyle} aria-label={`Current ${stat}`}>
                    <StatBreakdown label={"Stat"} value={this.props.effStats[this.props.stat]} />
                </td>
                <td style={changeStyle}>
                    ({change >= 0 ? "+" : ""}{change})
                </td>
                {/* Tap here should not make the controls disappear. */}
                { this.props.onMod ?
                <td onTouchEnd={(e) => e.stopPropagation()}>
                    <div style={controlStyle}>
                        <span style={incStyle}
                              role={"button"}
                              aria-label={`Increase ${stat}`}
                              onClick={(e) => {return this.handleIncrease(e)}}
                        ><GoArrowUp /></span>
                        <span style={decStyle}
                              role={"button"}
                              aria-label={`Decrease ${stat}`}
                              onClick={(e) => {return this.handleDecrease(e)}}
                        ><GoArrowDown /></span>
                    </div>
                </td>
                    : ''
                }
            </tr>)
    }
}

StatRow.propTypes = {
    stat: PropTypes.string.isRequired,
    initialChar: PropTypes.object.isRequired,
    effStats: PropTypes.object.isRequired,
    baseStats: PropTypes.object.isRequired,
    url: PropTypes.string.isRequired,
    onMod: PropTypes.func
};

export default StatRow;
