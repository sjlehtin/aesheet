import React from 'react';
import PropTypes from 'prop-types';

import DropdownList from 'react-widgets/DropdownList';
import AddFirearmControl from './AddFirearmControl';

const rest = require('./sheet-rest');

class AmmoControl extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            busy: false,
            ammoChoices: [],
            selectedAmmo: undefined
        };
    }

    async componentDidMount() {
        await this.updateAmmoSelection();
    }

    async updateAmmoSelection() {
        if (this.props.url) {
            await this.setState({busy: true});
            let json = await rest.getData(this.props.url)
            await this.setState({busy: false, ammoChoices: json})
        }
    }

    handleChange(value) {

        this.setState({busy: true});
        this.props.onChange(value).then(() => this.setState({busy: false}))
            .catch((err) => { console.log("Failed change");
                              this.setState({busy: false}) });
    }

    render() {
        return <DropdownList value={this.props.ammo}
                           busy={this.state.busy}
                           textField={(obj) => {
                               return AddFirearmControl.formatAmmo(obj);
                           }}
                           onChange={(value) => this.handleChange(value)}
                           filter="contains"
                           data={this.state.ammoChoices}
            />;
    }
}

AmmoControl.propTypes = {
    ammo: PropTypes.object.isRequired,
    url: PropTypes.string,
    onChange: PropTypes.func
};

export {AmmoControl};
export default AmmoControl;
