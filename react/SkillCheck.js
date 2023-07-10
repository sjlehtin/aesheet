import React from "react";
import {OverlayTrigger, Tooltip} from "react-bootstrap"
import PropTypes from "prop-types";

class SkillCheck extends React.Component {
    constructor(props) {
        super(props);

        this.state = {show: false};
    }

    render() {
        let rows = []
        this.props.checkBreakdown.forEach((row, index) => {
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
                    aria-label={"Skill check"}>
            <OverlayTrigger
                show={this.state.show}
                onToggle={(shouldShow) => this.setState({show: shouldShow})}
                delay={{show: 200, hide: 400}}
                placement={"left"}
                container={containerRef}
                target={targetRef}
                overlay={(props) =>
                    <Tooltip {...props}>
                        <div>
                            <table aria-label={"Skill check breakdown"}>
                                <thead>
                                <tr>
                                    <th colSpan={2}>Skill check breakdown</th>
                                </tr>
                                </thead>
                                <tbody>
                                {rows}
                                </tbody>
                            </table>
                        </div>
                    </Tooltip>
                }>
                <div ref={targetRef}>{this.props.skillCheck}</div>
            </OverlayTrigger>
        </div>
    }
}


SkillCheck.propTypes = {
    skillName: PropTypes.string.isRequired,
    skillCheck: PropTypes.number.isRequired,
    checkBreakdown: PropTypes.arrayOf(Object).isRequired
}

export default SkillCheck;
