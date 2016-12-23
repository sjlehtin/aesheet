import React from 'react';

var rest = require('./sheet-rest');

class CharacterNotes extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            editing: props.initialEditing,
            // TODO: Should be filled in componentDidMount if left undefined.
            notes: undefined,
            old_value: ""
        };
    }

    componentDidMount() {
        rest.getData(this.props.url).then((json) => {
            this.setState({notes: json.notes});
        });
    }

    handleSubmit(event) {
        /* PATCH the backend character with updated values. */
        event.preventDefault();
        rest.patch(this.props.url, {
            "notes": this.state.notes
        }).then(function () {
            this.setState({
                editing: false
            })
        }.bind(this)).catch(function (reason) {
            console.log("Failed to update char:", reason)
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
                <textarea style={fieldStyle}
                          onClick={this.handleEdit.bind(this)}
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

CharacterNotes.defaultProps = { initialEditing: false };

export default CharacterNotes;