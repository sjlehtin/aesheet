import React from 'react';

import cookie from 'react-cookie';

require('whatwg-fetch');

class CharacterNotes extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            editing: props.editing,
            csrftoken: cookie.load('csrftoken'),
            // TODO: Should be filled in componentDidMount if left undefined.
            notes: undefined,
            old_value: ""
        };
    }

    componentDidMount() {
        fetch(this.props.url)
            .then((response) =>
        {
            response.json().then((json) => {
                this.setState({notes: json.notes});
            });
        });
    }

    handleSubmit(event) {
        /* PATCH the backend character with updated values. */
        event.preventDefault();
        fetch(this.props.url, {
            method: "PATCH",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'X-CSRFToken': this.state.csrftoken
            },
            credentials: 'same-origin',
            body: JSON.stringify({
                "notes": this.state.notes
            })
        }).then((response) => {
            // TODO: should use more generic handling for the error values,
            // see, e.g., fetch README.md.
            if (response.status >= 200 && response.status < 300) {
                this.setState({
                    editing: false
                });
                return response.json();
            } else {
                throw new Error(response.statusText);
            }
        });
    }

    handleEdit(event) {
        event.preventDefault();
        this.setState({
            editing: true,
            old_value: this.state.notes });
    }

    handleCancel(event) {
        event.preventDefault();
        this.setState({
            editing: false,
            notes: this.state.old_value
        });
    }

    handleChange(event) {
        this.setState({notes: event.target.value});
    }

    render() {
        var fieldStyle = {
            width: "100%",
            height: "20em",
            scrollY: "auto"
        };
        var notesField;
        if (!this.state.editing) {
            notesField = (<div>
                <textarea style={fieldStyle} onClick={this.handleEdit.bind(this)}
                 disabled value={this.state.notes} />
                <a href="#" onClick={this.handleEdit.bind(this)}
                   className="edit-control">Edit</a>
                </div>);
        } else {
            notesField = (
                <form><textarea
                    style={fieldStyle}
                    value={this.state.notes}
                    onChange={this.handleChange.bind(this)}/>
                    <a href="#" onClick={this.handleCancel.bind(this)}
                       className="edit-control">Cancel</a>
                    <input type="submit" value="Update" name="character-note"
                           className="edit-control"
                           onClick={this.handleSubmit.bind(this)}/>
                </form>);
        }
        return (<div className="character-note">
            <h3>
                Character notes
            </h3>
            {notesField}

        </div>)
    }
}

export default CharacterNotes;