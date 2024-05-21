import React from 'react';

import { Button, Form } from 'react-bootstrap';

import Loading from 'Loading'

const rest = require('./sheet-rest');

class CharacterNotes extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            editing: false,
            notes: "",
            isBusy: true,
            old_value: ""
        };
    }

    async componentDidMount() {
        const json = await rest.getData(this.props.url)
        this.setState({notes: json.notes, isBusy: false});
    }

    async handleSubmit() {
        /* PATCH the backend character with updated values. */
        this.setState({isBusy: true})
        try {
            await rest.patch(this.props.url, {
                notes: this.state.notes,
            })
            this.setState({
                editing: false,
                isBusy: false
            })
        } catch (reason) {
            console.log("Failed to update char:", reason)
        }
    }

    handleEdit() {
        this.setState({
            editing: true,
            old_value: this.state.notes });
    }

    handleCancel() {
        this.setState({
            editing: false,
            notes: this.state.old_value
        });
    }

    handleChange(event) {
        this.setState({notes: event.target.value});
    }

    render() {
        const fieldStyle = {
            width: "100%",
            height: "20em",
            scrollY: "auto"
        };
        let notesField;
        if (!this.state.editing) {
            notesField = <Form>
                <Form.Control as={"textarea"}
                              // style={Object.assign({color: '#555'}, fieldStyle)}
                            readOnly value={this.state.notes}
                               rows={20}
                            onClick={() => this.handleEdit() } />
                    <Button onClick={() => this.handleEdit()}>Edit</Button>
                </Form>
        } else {
            notesField = (
                <Form><Form.Control
                     as={"textarea"}
                    // style={fieldStyle}
                    value={this.state.notes}
                     rows={20}
                    onChange={(e) => this.handleChange(e) }/>
                    <Button onClick={() => {return this.handleCancel()}}>Cancel</Button>{' '}
                    <Button onClick={() => {return this.handleSubmit()}}>Update</Button>
                </Form>);
        }

        let loading;

        if (this.state.isBusy) {
            loading = <Loading />
        } else {
            loading = ""
        }

        return <div>
            <h3>
                Character notes
                {loading}
            </h3>
            {notesField}
        </div>
    }
}

export default CharacterNotes;