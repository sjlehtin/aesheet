import React from 'react';

class Character extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            editing: false,

            char: {notes: "original notes\n\nskudaa pudaa"}
        };
    }

    componentDidMount() {

    }


    handleSubmit(event) {
        this.setState({editing: false});
        /* PATCH the backend character with updated values. */
        event.preventDefault();
    }

    handleEdit(event) {
        event.preventDefault();
        this.setState({editing: true});
    }

    handleChange(event) {
        this.setState({char: {notes: event.target.value}});
    }

    render() {
        var notesField;
        console.log("my state: ", this.state);
        if (!this.state.editing) {
            console.log("eh");
            notesField = (<div><pre alt="Click to edit notes" onClick={this.handleEdit.bind(this)}>{this.state.char.notes}</pre>
                </div>);
        } else {
            console.log("uh");
            notesField = (<form><textarea
                value={this.state.char.notes}
                onChange={this.handleChange.bind(this)}/>
                <input type="submit" value="Update"
                       onClick={this.handleSubmit.bind(this)}/></form>);
        }
        return (<div>
            <h3>
                This is the Character component.
            </h3>
            {notesField}

        </div>)
    }
}

export default Character;