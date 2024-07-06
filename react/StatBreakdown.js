import React from "react";
import {OverlayTrigger, Tooltip} from "react-bootstrap"
import PropTypes from "prop-types";

class StatBreakdown extends React.Component {
    constructor(props) {
        super(props);

        this.state = {show: false};
    }

    render() {
        let rows = []

        let toFixed = 2
        let coerceMainValue = false
        if (this.props.toFixed !== undefined) {
            coerceMainValue = true
            toFixed = this.props.toFixed
        }

        function renderValue(value) {
            if (coerceMainValue || !Number.isInteger(value)) {
                value = value.toFixed(toFixed)
            }
            return value;
        }

        let value
        let breakdown

        if (typeof(this.props.value) === "number") {
            value = this.props.value
            breakdown = this.props.breakdown ?? []
        } else {
            value = this.props.value.value()
            breakdown = this.props.value.breakdown()
        }

        breakdown.forEach((row, index) => {
            // TODO: logic to ValueBreakdown
            let value = row.value
            value = renderValue(value);
            rows.push(<tr key={index}>
                <td>{row.reason}</td>
                <td>{row.operation !== '+' ? row.operation ?? '' : ''}{value}</td>
            </tr>)
        })
        const containerRef = React.createRef()
        const targetRef = React.createRef()
        const label = this.props.label ?? "Skill check"
        return <div ref={containerRef}
                    onClick={() => {
                        this.setState({show: !this.state.show})
                    }}
                    style={this.props.style}
                    aria-label={label}>
            <OverlayTrigger
                show={this.state.show}
                onToggle={(shouldShow) => this.setState({show: shouldShow})}
                delay={{show: 200, hide: 400}}
                placement={"right"}
                container={containerRef}
                target={targetRef}
                overlay={(props) =>
                    <Tooltip {...props}>
                        <div>
                            <table aria-label={`${label} breakdown`}>
                                <thead>
                                <tr>
                                    <th colSpan={2}>{`${label} breakdown`}</th>
                                </tr>
                                </thead>
                                <tbody>
                                {rows}
                                </tbody>
                            </table>
                        </div>
                    </Tooltip>
                }>
                <div ref={targetRef}>{renderValue(value)}{this.props.units}</div>
            </OverlayTrigger>
        </div>
    }
}


StatBreakdown.propTypes = {
    value: PropTypes.oneOfType([PropTypes.number, PropTypes.object]).isRequired,
    breakdown: PropTypes.arrayOf(Object),
    style: PropTypes.object,
    label: PropTypes.string,
    toFixed: PropTypes.number,
    units: PropTypes.string,
}

export default StatBreakdown
