import React from 'react';

import {Row, Col, Image} from 'react-bootstrap';

var rest = require('sheet-rest');

class NoteBlock extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
        };
    }

    render () {
        var positiveList = [], negativeList = [];
        this.props.edges.forEach((elem, ii) => {
            if (elem.notes.length > 0) {
                if (parseFloat(elem.cost) > 0) {
                    positiveList.push(elem);
                } else {
                    negativeList.push(elem);
                }
            }
        });
        var positive, negative;

        var generateNoteContainer = function (noteType, edgeList) {
            return <ul className={noteType}>{edgeList.map((elem, ii) => {
                return <li key={ii}
                           title={`${elem.edge} ${elem.level}`}>{elem.notes}</li>;
            })}</ul>;
        };

        if (positiveList.length > 0) {
            positive = generateNoteContainer("positive", positiveList);
        }
        if (negativeList.length > 0) {
            negative = generateNoteContainer("negative", negativeList);
        }
        return <div>
            {positive}
            {negative}
        </div>;
    }
}

NoteBlock.propTypes = {
    edges: React.PropTypes.array.isRequired
};

export default NoteBlock;
