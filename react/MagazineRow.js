import React from 'react';
import PropTypes from 'prop-types';

import {Col, Row, Button, Form} from 'react-bootstrap';
const util = require('./sheet-util');

class MagazineRow extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            busy: false,
            value: this.props.magazineSize
        };
    }

    async handleShoot() {
        await this.props.onChange({current: this.props.current - 1})
    }

    render () {
        let display = []
        const ammoStyle = {width: "8px", maxWidth: "8px", display: "inline-block"}

        const unspentAmmoStyle = Object.assign({}, ammoStyle)
        const spentAmmoStyle = Object.assign({}, ammoStyle)

        for (const ind of Array(this.props.current).keys()) {
            display.push(<span style={unspentAmmoStyle} key={`unspent-${ind}`}>⦾</span>)
        }
        for (const ind of Array(this.props.capacity - this.props.current).keys()) {
            display.push(<span style={spentAmmoStyle} key={`spent-${ind}`}>•</span>)
        }

        display.push(<span key={"numbers"} style={{marginLeft: "2em"}}>{this.props.current}/{this.props.capacity}</span>)
        return <Row aria-label={`Magazine of size ${this.props.capacity} with ${this.props.current} bullets remaining`}>
            <Col md={6}>
                {display}
            </Col>
            <Col md={2}><Button aria-label={"Shoot"} size={"sm"} onClick={async () => this.handleShoot() }>Shoot!</Button></Col>
            <Col md={2}><Button aria-label={"Remove magazine"} size={"sm"} onClick={async () => {await this.props.onRemove()}}>Remove</Button></Col>
            <Col md={2}><span aria-label={"Weight"}>{this.props.currentMagazineWeight.toFixed(2)} kg</span></Col>
        </Row>
    }
}

MagazineRow.props = {
    size: PropTypes.number.isRequired,
    current: PropTypes.number.isRequired,
    currentMagazineWeight: PropTypes.number,
    onChange: PropTypes.func,
    onRemove: PropTypes.func
};

export {MagazineRow}
export default MagazineRow;
