import React from 'react';
import PropTypes from 'prop-types';
import {Form, Col, Row} from 'react-bootstrap';
import {DropdownList} from 'react-widgets';

class RangeControl extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            currentValue: ""
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
            this.props.onChange({
                range: val === ""? "" : parseFloat(val),
                darknessDetectionLevel: 0
            })
        }
    }

    handleDetectionLevelChange(event) {
    }

    render() {
        return <div>
            <Form.Group aas={Row}>
            <Form.Label column sm={"2"}>Range</Form.Label>
                <Col>
                <Form.Control ref={(c) => this._inputField = c}
                          size="sm" type="text"
                          sm={"2"}
                          label="Target at range"
                          placeholder={"Leave empty to shoot to short range"}
                          onChange={(e) => this.handleChange(e)}
                          isValid={this.isValid()}
                          value={this.state.currentValue}
            />
                </Col>
            <Form.Label column sm={"2"}>Darkness DL</Form.Label>
                <Col>
                <DropdownList data={RangeControl.detectionLevels}
                          textField={item => `${item.description} (${item.detectionLevel})`}
                          valueField='detectionLevel'
                          value={this.state.selectedLevel}
                              defaultValue={RangeControl.detectionLevels[0]}
                          onChange={(value) => this.handleDetectionLevelChange(value)} />
                </Col>
            </Form.Group>
        </div>;
    }
}

RangeControl.propTypes = {
    onChange: PropTypes.func
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
