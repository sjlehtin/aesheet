import React from 'react';
import PropTypes from 'prop-types';

import DropdownList from "react-widgets/DropdownList"

import WeaponRow from "WeaponRow";

class UseTypeControl extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            busy: false,
            useType: this.props.useType ?? WeaponRow.FULL
        };
    }

    async handleChange(useType) {
        this.setState({useType: useType, busy: true})
        await this.props.onChange(useType)
        this.setState({busy: false})
    }

    render () {
        const choices = [{value: WeaponRow.FULL, name: "Full"},
            {value: WeaponRow.PRI, name: "Primary"},
            {value: WeaponRow.SEC, name: "Secondary"}
        ];
        return <DropdownList busy={this.state.busy}
                             value={this.state.useType}
                             textField={"name"}
                             dataKey={"value"}
                            onChange={async (obj) => await this.handleChange(obj.value)}
                            aria-label={"Use type selection"}
                            data={choices}

        />
    }
}

UseTypeControl.props = {
    firearm: PropTypes.object.isRequired,
    onChange: PropTypes.func,
    onRemove: PropTypes.func,
    onAdd: PropTypes.func
};

export {UseTypeControl}
export default UseTypeControl;
