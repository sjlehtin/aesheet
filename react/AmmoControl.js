import React from 'react';
import ReactDOM from 'react-dom';

class AmmoControl extends React.Component {
    render() {
        return <div>{this.props.ammo.label} {this.props.ammo.bullet_type}</div>;
    }
}

AmmoControl.props = {
    ammo: React.PropTypes.object.isRequired
};

export {AmmoControl};
export default AmmoControl;
