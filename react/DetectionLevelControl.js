import React from 'react';
import PropTypes from 'prop-types';
import {Form, Col, Row} from 'react-bootstrap';
import {DropdownList} from 'react-widgets';
import RangeControl from "./RangeControl";


class DetectionLevelControl extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            currentValue: props.initialRange ?? "",
            currentRange: props.initialRange ?? null,
            currentDetectionLevel: props.initialDetectionLevel ?? 0
        };
    }

    isValid(val) {
        if (val === undefined) {
            val = this.state.currentValue;
        }
        // Allow clearing the field.
        if (val === "") {
            return true;
        }
        return !isNaN(parseFloat(val));
    }

    handleChange(value) {
        this.setState({currentRange: value});
        this.props.onChange({
            range: value,
            darknessDetectionLevel: this.state.currentDetectionLevel
        })
    }

    handleDetectionLevelChange(value) {
        this.setState({currentDetectionLevel: value.detectionLevel});
        this.props.onChange({
            range: this.state.currentRange,
            darknessDetectionLevel: value.detectionLevel
        });
    }

    render() {
        return <div>
            <Form.Group as={Row}>
                <Col>
                    <RangeControl initialValue={this.props.initialRange ?? ""}
                                        onChange={this.handleChange.bind(this)} />
                </Col>
                <Col>
            <Form.Label column sm={"3"}>Darkness DL</Form.Label>
                <DropdownList data={DetectionLevelControl.detectionLevels}
                              aria-label={"Darkness DL"}
                          textField={item => `${item.description} (${item.detectionLevel})`}
                          dataKey='detectionLevel'
                          value={this.state.currentDetectionLevel}
                          defaultValue={DetectionLevelControl.detectionLevels[0]}
                          onChange={(value) => this.handleDetectionLevelChange(value)} />
                </Col>
            </Form.Group>
        </div>;
    }
}

DetectionLevelControl.propTypes = {
    onChange: PropTypes.func,
    initialRange: PropTypes.oneOfType([
        PropTypes.string,  PropTypes.number ]),
    initialDetectionLevel: PropTypes.number
};

DetectionLevelControl.detectionLevels = [
    {detectionLevel: 0, description: "Clear"},
    {detectionLevel: -1, description: "Dusk"},
    {detectionLevel: -2, description: "Artificial light"},
    {detectionLevel: -3, description: "Moonlight"},
    {detectionLevel: -4, description: "Darkness"},
    {detectionLevel: -5, description: "Darkness in Shelob's lair"},
    {detectionLevel: -6, description: "Darkness in Barad-dûr"},
    {detectionLevel: -7, description: "Pitch black"},
];

export {DetectionLevelControl};
export default DetectionLevelControl;
