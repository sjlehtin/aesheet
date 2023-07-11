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
        this.props.breakdown.forEach((row, index) => {
            rows.push(<tr key={index}>
                <td>{row.reason}</td>
                <td>{row.value}</td>
            </tr>)
        })
        const containerRef = React.createRef()
        const targetRef = React.createRef()
        return <div ref={containerRef}
                    onClick={() => {
                        this.setState({show: !this.state.show})
                    }}
                    style={this.props.style}
                    aria-label={"Skill check"}>
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
                            <table aria-label={"Stat breakdown"}>
                                <thead>
                                <tr>
                                    <th colSpan={2}>Stat breakdown</th>
                                </tr>
                                </thead>
                                <tbody>
                                {rows}
                                </tbody>
                            </table>
                        </div>
                    </Tooltip>
                }>
                <div ref={targetRef}>{this.props.value}</div>
            </OverlayTrigger>
        </div>
    }
}


StatBreakdown.propTypes = {
    value: PropTypes.number.isRequired,
    breakdown: PropTypes.arrayOf(Object).isRequired,
    style: PropTypes.object
}

export default StatBreakdown
