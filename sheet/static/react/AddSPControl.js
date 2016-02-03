import React from 'react';
import ReactDOM from 'react-dom';
import { Button, Input } from 'react-bootstrap';

var util = require('sheet-util');

class AddSPControl extends React.Component {
    constructor(props) {
        super(props);
        this.state = {ageSP: this.props.initialAgeSP}
    }

    /* Without this, the component will not react to property changes. */
    componentWillReceiveProps(props) {
        this.setState({ageSP: props.initialAgeSP});
    }

    handleChange(e) {
        this.setState({ageSP: e.target.value});
    }

    validationState() {
        return util.isInt(this.state.ageSP) ? "success" : "error";
    }

    isValid() {
        return this.validationState() == "success";
    }

    handleSubmit() {
        if (this.isValid()) {
            this.props.onAdd(parseInt(this.state.ageSP));
            this.setState({ageSP: this.props.initialAgeSP});
        }
    }

    handleKeyDown(e) {
        if (e.keyCode === 13) {
            /* Enter. */
            this.handleSubmit();
        }
    }

    render() {
        var inputStyle = {textAlign: "right", marginRight: 5, marginLeft: 5,
            width: "4em"};
        if (this.validationState() == "error") {
            inputStyle.color = "red";
        }
        return <div title="Age SP is added every five adventures">
            <label>Age SP:</label>
            <input ref={(c) =>
                     c ? this._inputField = ReactDOM.findDOMNode(c) : null}
                   type="text"
                   onChange={(e) => this.handleChange(e)}
                   //bsStyle={this.validationState()}
                   //hasFeedback
                   value={this.state.ageSP}
                   onKeyDown={(e) => this.handleKeyDown(e)}
                   style={inputStyle}
            />
            <Button bsSize="xsmall"
                    ref={(c) =>
                      c ? this._addButton = ReactDOM.findDOMNode(c) : null}
                    disabled={!this.isValid()}
                    onClick={(e) => this.handleSubmit()}
            >Add SP</Button>
        </div>
    };
}

AddSPControl.propTypes = {
    initialAgeSP: React.PropTypes.number.isRequired,
    onAdd: React.PropTypes.func.isRequired
};

export default AddSPControl;
