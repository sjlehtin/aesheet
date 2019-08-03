import React from 'react';
import PropTypes from 'prop-types';

import {Row, Col, Image} from 'react-bootstrap';

const rest = require('./sheet-rest');

class NoteBlock extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
        };
    }

    static itemHasNotes(elem) {
        return !!elem.notes;
    }

    render () {
        var positiveList = [], negativeList = [];
        this.props.edges.filter(NoteBlock.itemHasNotes).forEach((elem, ii) => {
            if (parseFloat(elem.cost) > 0) {
                positiveList.push(elem);
            } else {
                negativeList.push(elem);
            }
        });
        var positive, negative, effects;

        var generateNoteContainer = function (noteType, edgeList, formatItem) {
            var colorMap = {positive: "blue", negative: "red",
                neutral: "grey"};

            var color = colorMap[noteType];

            return <ul style={{fontSize: "80%", color: color}}>
                {edgeList.map((elem, ii) => {
                    var title = formatItem(elem);
                    if (title) {
                        title += ": ";
                    }
                    return <li key={ii}>
                        {`${title}${elem.notes}`}</li>;
                })}</ul>;
        };

        var formatEdge = function (edge) {
            return `${edge.edge.name} ${edge.level}`;
        };
        var formatEffect = function (effect) {
            return effect.name; // TODO: no "from" field yet.
        }
        if (positiveList.length > 0) {
            positive = generateNoteContainer("positive", positiveList, formatEdge);
        }
        if (negativeList.length > 0) {
            negative = generateNoteContainer("negative", negativeList, formatEdge);
        }
        var effectsWithNotes = this.props.effects.filter(NoteBlock.itemHasNotes);
        if (effectsWithNotes.length > 0) {
            effects = generateNoteContainer("neutral", effectsWithNotes, formatEffect);
        }
        return <div>
            {positive}
            {negative}
            {effects}
        </div>;
    }
}

NoteBlock.propTypes = {
    edges: PropTypes.array,
    effects: PropTypes.array
};

NoteBlock.defaultProps = {
    edges: [],
    effects: []
};

export default NoteBlock;
