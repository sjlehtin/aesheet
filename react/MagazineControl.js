import React from 'react';
import PropTypes from 'prop-types';

import {Col, Row, Button, Form} from 'react-bootstrap';
const util = require('./sheet-util');
import MagazineRow from 'MagazineRow'

class MagazineControl extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            busy: false,
            value: this.props.magazineSize
        };
    }

    handleChange (e) {
        this.setState({value: e.target.value })
    }

    isValid () {
        return util.isInt(this.state.value)
    }

    async handleClick (e) {
        this.setState({busy: true})
        await this.props.onAdd({capacity: parseInt(this.state.value, 10)})
        this.setState({busy: false, value: this.props.magazineSize})
    }

    render () {

        let magazines = []
        if (this.props.magazines?.length) {
            for (const [ind, mag] of this.props.magazines.entries()) {
                magazines.push(<MagazineRow key={ind} capacity={mag.capacity}
                                            current={mag.current}
                                            onChange={async (change) => {
                                                await this.props.onChange(Object.assign({}, mag, change))}}
                                            onRemove={async () => await this.props.onRemove(mag)}
                />)
            }
        } else {
            magazines.push(<Row key={0}><strong>No magazines</strong></Row>)
        }
        return <div>
            <Row>
                <Col>
            <Form.Label htmlFor={"mag-size"}>Magazine size</Form.Label>
                    </Col>
                <Col>
                    <Form.Control type={"text"} id={"mag-size"} isValid={this.isValid()} value={this.state.value} onChange={(e) => {this.handleChange(e)}} />
                    </Col>
                <Col>
                    <Button aria-label={"Add magazine"} size={"sm"} disabled={!this.isValid()} onClick={async (e) => await this.handleClick(e)}>Add</Button>
                </Col>
                </Row>
            {magazines}
        </div>
    }
}

MagazineControl.props = {
    magazineSize: PropTypes.number.isRequired,
    magazines: PropTypes.arrayOf(Object).isRequired,
    onChange: PropTypes.func,
    onRemove: PropTypes.func,
    onAdd: PropTypes.func
};

export {MagazineControl}
export default MagazineControl;
