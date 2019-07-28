import React from 'react';

import DropdownList from 'react-widgets/lib/DropdownList';

const rest = require('./sheet-rest');

class ScopeControl extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            busy: false,
            editing: false,
            open: false,
            scopeChoices: [],
            selectedScope: undefined
        };
    }

    componentDidMount() {
        this.updateScopeSelection();
    }

    updateScopeSelection() {
        this.setState({busy: true});
        return rest.getData(this.props.url).then(json => {
            this.setState({busy: false, scopeChoices: json});
        }).catch(e => {
                console.log("got error", e.message);
                this.setState({busy: false});
            });
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
                              value={this.props.scope}
                              busy={this.state.busy}
                              textField={(obj) => {
                                  console.log("obj?", obj);
                                  return obj.name;}}
                              onChange={(value) => this.handleChange(value)}
                              onToggle={(isOpen) => this.setState({open: isOpen})}
                              filter="contains"
                              data={this.state.scopeChoices}

                />;
        return <div onKeyDown={this.handleKeyDown.bind(this)}>
            {content}
        </div>;
    }
}

ScopeControl.props = {
    scope: React.PropTypes.object.isRequired,
    url: React.PropTypes.string,
    onChange: React.PropTypes.func
};

export {ScopeControl};
export default ScopeControl;
