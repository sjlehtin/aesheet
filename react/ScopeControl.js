import React from 'react';
import PropTypes from 'prop-types';

import DropdownList from 'react-widgets/DropdownList'

const rest = require('./sheet-rest');

class ScopeControl extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            busy: false,
            editing: false,
            scopeChoices: [],
            selectedScope: undefined,
            loading: !!props.url
        };
    }

    async componentDidMount() {
        await this.updateScopeSelection();
    }

    async updateScopeSelection() {
        if (this.props.url) {
            this.setState({busy: true})
            let json = await rest.getData(this.props.url)
            this.setState({busy: false, scopeChoices: json, loading: false})
        }
    }

    async handleChange(value) {
        this.setState({busy: true})
        await this.props.onChange(value)
        this.setState({busy: false})
    }

    render() {
        return <DropdownList value={this.props.scope}
                             busy={this.state.busy}
                             aria-busy={true || this.state.busy}
                             textField={(obj) => {
                                 return obj ? obj.name : "";
                             }}
                             onChange={async (value) => await this.handleChange(value)}
                             filter="contains"
                             placeholder={"Add a scope"}
                             aria-label={"Scope selection"}
                             data={this.state.scopeChoices}

        />
    }
}

ScopeControl.props = {
    scope: PropTypes.object.isRequired,
    url: PropTypes.string,
    onChange: PropTypes.func
};

export {ScopeControl};
export default ScopeControl;
