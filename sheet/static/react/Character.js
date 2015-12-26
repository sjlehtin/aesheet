import React from 'react';

import cookie from 'react-cookie';

require('whatwg-fetch');

class Character extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            editing: props.editing,
            csrftoken: cookie.load('csrftoken'),
            // Should be filled in componentDidMount if left undefined.
            notes: undefined,
            old_value: ""
        };
    }

    componentDidMount() {
        window.fetch(this.props.url)
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
        window.fetch(this.props.url, {
            method: "patch",
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
        var notesField;
        if (!this.state.editing) {
            notesField = (<div>
                <pre onClick={this.handleEdit.bind(this)}
                >{this.state.notes}</pre>
                <a href="#" onClick={this.handleEdit.bind(this)}
                   className="edit-control">Edit</a>
                </div>);
        } else {
            notesField = (<form><textarea
                value={this.state.notes}
                onChange={this.handleChange.bind(this)}/>
                <a href="#" onClick={this.handleCancel.bind(this)}
                   className="edit-control">Cancel</a>
                <input type="submit" value="Update" name="character-note"
                       className="edit-control"
                       onClick={this.handleSubmit.bind(this)}/></form>);
        }
        return (<div className="character-note">
            <h3>
                Character notes
            </h3>
            {notesField}

        </div>)
    }
}

export default Character;