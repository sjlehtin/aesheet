import React from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';

import { Button } from 'react-bootstrap';

var util = require('./sheet-util');

class AddSPControl extends React.Component {
    constructor(props) {
        super(props);
        this.state = {ageSP: this.props.initialAgeSP}
    }

    handleChange(e) {
        this.setState({ageSP: e.target.value});
    }

    validationState() {
        return util.isInt(this.state.ageSP) ? "success" : "error";
    }

    isValid() {
        return this.validationState() === "success";
    }

    handleSubmit() {
        if (this.isValid()) {
            this.props.onAdd(parseInt(this.state.ageSP));
            this.setState({ageSP: this.props.initialAgeSP});
        }
    }

    handleKeyDown(e) {
        if (e.key === "Enter") {
            /* Enter. */
            this.handleSubmit();
        }
    }

    render() {
        var inputStyle = {textAlign: "right", marginRight: 5, marginLeft: 5,
            width: "4em"};
        if (this.validationState() === "error") {
            inputStyle.color = "red";
        }
        return <div title="Age SP is added every five adventures">
            <label>Age SP:</label>
            <input type="text"
                   onChange={(e) => this.handleChange(e)}
                   value={this.state.ageSP}
                   onKeyDown={(e) => this.handleKeyDown(e)}
                   style={inputStyle}
            />
            <Button size="sm"
                    disabled={!this.isValid()}
                    onClick={(e) =>
                        this.handleSubmit()}>Add SP</Button>
        </div>
    };
}

AddSPControl.propTypes = {
    initialAgeSP: PropTypes.number.isRequired,
    onAdd: PropTypes.func.isRequired
};

export default AddSPControl;
