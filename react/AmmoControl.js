import React from 'react';

import {Button, Col, Row} from 'react-bootstrap';
import DropdownList from 'react-widgets/lib/DropdownList';
import AddFirearmControl from './AddFirearmControl';

const rest = require('./sheet-rest');

class AmmoControl extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            busy: false,
            editing: false,
            open: false,
            ammoChoices: [],
            selectedAmmo: undefined
        };
    }

    componentDidMount() {
        this.updateAmmoSelection();
    }

    updateAmmoSelection() {
        this.setState({busy: true});
        return rest.getData(this.props.url).then(json => {
            this.setState({busy: false, ammoChoices: json});
        });
    }

    handleChangeClick() {
        this.setState({busy: true, editing: true});

        this.updateAmmoSelection();
    }

    cancelEdit() {
        this.setState({editing: false,
                       selectedAmmo: undefined});
    }

    handleKeyDown(e) {
        if (e.keyCode === 27) {
            /* Escape. */
            this.setState({open: false});
        }
    }

    handleChange(value) {

        this.setState({busy: true});
        this.props.onChange(value).then(() => this.setState({busy: false}))
            .catch((err) => { console.log("Failed change");
                              this.setState({busy: false}) });
    }

    render() {
        let content =
                <DropdownList open={this.state.open}
                              value={this.props.ammo}
                              busy={this.state.busy}
                              textField={(obj) => {return AddFirearmControl.formatAmmo(obj);}}
                              onChange={(value) => this.handleChange(value)}
                              onToggle={(isOpen) => this.setState({open: isOpen})}
                              filter="contains"
                              data={this.state.ammoChoices}

                />;
        return <div onKeyDown={this.handleKeyDown.bind(this)}>
            {content}
        </div>;
    }
}

AmmoControl.props = {
    ammo: React.PropTypes.object.isRequired,
    url: React.PropTypes.string,
    onChange: React.PropTypes.func
};

export {AmmoControl};
export default AmmoControl;
