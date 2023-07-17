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

        function renderValue(value) {
            if (!Number.isInteger(value)) {
                value = value.toFixed(2)
            }
            return value;
        }

        this.props.breakdown.forEach((row, index) => {
            let value = row.value
            value = renderValue(value);
            rows.push(<tr key={index}>
                <td>{row.reason}</td>
                <td>{value}</td>
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
                <div ref={targetRef}>{renderValue(this.props.value)}</div>
            </OverlayTrigger>
        </div>
    }
}


StatBreakdown.propTypes = {
    value: PropTypes.number.isRequired,
    breakdown: PropTypes.arrayOf(Object).isRequired,
    style: PropTypes.object,
    label: PropTypes.string
}

export default StatBreakdown
