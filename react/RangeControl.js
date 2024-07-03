import React from 'react';
import PropTypes from 'prop-types';
import {Form, Col, Row} from 'react-bootstrap';
import {DropdownList} from 'react-widgets';
const util = require('./sheet-util');

class RangeControl extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            currentValue: props.initialRange ?? "",
            currentRange: props.initialRange ?? null,
            currentDetectionLevel: props.initialDetectionLevel ?? 0
        };
    }

    isValid(val) {
        if (typeof(val) === "undefined") {
            val = this.state.currentValue;
        }
        // Allow clearing the field.
        if (val === "") {
            return true;
        }
        return !isNaN(parseFloat(val));
    }

    handleChange(event) {
        let val = event.target.value;
        this.setState({currentValue: event.target.value});
        if (this.isValid(val)) {
            let range = val === "" ? "" : parseFloat(val);
            this.setState({currentRange: range});
            this.props.onChange({
                range: range,
                darknessDetectionLevel: this.state.currentDetectionLevel
            });
        }
    }

    handleDetectionLevelChange(value) {
        this.setState({currentDetectionLevel: value.detectionLevel});
        this.props.onChange({
            range: this.state.currentRange,
            darknessDetectionLevel: value.detectionLevel
        });
    }

    render() {
        let visionCheck = '';
        if (this.props.skillHandler) {
            if (util.isFloat(this.state.currentRange)) {
                const check = this.props.skillHandler.nightVisionCheck(this.state.currentRange,
                    this.state.currentDetectionLevel);

                let style = {};
                let verbose = '';
                if (check < 75) {
                    style.color = 'hotpink';
                    verbose = `Ranged penalty: ${75 - check}`;
                } else if (check >= 100) {
                    style.fontWeight = 'bold';
                    verbose = "Bumping enabled";
                }
                visionCheck =
                    <div><span>Vision check:</span><span style={style}
                                                         aria-label={"Vision check"}>{check}</span>
                        <span className={"ml-2"} style={{fontStyle: "italic"}}
                              aria-label={"Vision check detail"}>{verbose}</span>
                    </div>;
            }
        }
        return <div>
            <Form.Group aas={Row}>
                <Col>
            <Form.Label id={"range-control-label"} column sm={"2"}>Range</Form.Label>
                <Form.Control
                          size="sm" type="text"
                          sm={"2"}
                          aria-labelledby={"range-control-label"}
                          aria-label="Target at range"
                          placeholder={"Leave empty to shoot to short range"}
                          onChange={(e) => this.handleChange(e)}
                          isValid={this.isValid()}
                          value={this.state.currentValue}
            />
                </Col>
                <Col>
            <Form.Label column sm={"3"}>Darkness DL</Form.Label>
                <DropdownList data={RangeControl.detectionLevels}
                              aria-label={"Darkness DL"}
                          textField={item => `${item.description} (${item.detectionLevel})`}
                          dataKey='detectionLevel'
                          value={this.state.currentDetectionLevel}
                          defaultValue={RangeControl.detectionLevels[0]}
                          onChange={(value) => this.handleDetectionLevelChange(value)} />
                </Col>
            </Form.Group>
            <Row>
                <Col>
                    {visionCheck}
                </Col>
            </Row>
        </div>;
    }
}

RangeControl.propTypes = {
    onChange: PropTypes.func,
    skillHandler: PropTypes.object,
    initialRange: PropTypes.oneOfType([
        PropTypes.string,  PropTypes.number ]),
    initialDetectionLevel: PropTypes.number
};

RangeControl.detectionLevels = [
    {detectionLevel: 0, description: "Clear"},
    {detectionLevel: -1, description: "Dusk"},
    {detectionLevel: -2, description: "Artificial light"},
    {detectionLevel: -3, description: "Moonlight"},
    {detectionLevel: -4, description: "Darkness"},
    {detectionLevel: -5, description: "Darkness in Shelob's lair"},
    {detectionLevel: -6, description: "Darkness in Barad-dûr"},
    {detectionLevel: -7, description: "Pitch black"},
];

export {RangeControl};
export default RangeControl;
