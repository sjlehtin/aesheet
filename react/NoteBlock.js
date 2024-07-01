import React from 'react';

function itemHasNotes(elem) {
    return !!elem.notes;
}

export default function NoteBlock({edges = [], effects = [], compact = false}) {
        let positiveList = [], negativeList = [];
        edges.filter(itemHasNotes).forEach((elem, ii) => {
            if (parseFloat(elem.cost) > 0) {
                positiveList.push(elem);
            } else {
                negativeList.push(elem);
            }
        });
        let positive, negative;

        var generateNoteContainer = function (noteType, edgeList, formatItem) {
            const colorMap = {positive: "blue", negative: "red",
                neutral: "grey"};

            const color = colorMap[noteType];

            return <ul style={{fontSize: "80%", color: color}} aria-label={`${noteType} notes`}>
                {edgeList.map((elem, ii) => {
                    const content = <span>
                        <strong>{formatItem(elem)}</strong>
                        {compact ? '' : <>: {`${elem.notes}`}</>}
                        </span>
                    return <li key={ii}>{content}</li>;
                })}</ul>;
        };

        const formatEdge = function (edge) {
            return `${edge.edge.name} ${edge.level}`;
        };
        const formatEffect = function (effect) {
            return effect.name; // TODO: no "from" field yet.
        }
        if (positiveList.length > 0) {
            positive = generateNoteContainer("positive", positiveList, formatEdge);
        }
        if (negativeList.length > 0) {
            negative = generateNoteContainer("negative", negativeList, formatEdge);
        }
        const effectsWithNotes = effects.filter(itemHasNotes);
        return <div>
            {positive}
            {negative}
            {effectsWithNotes.length > 0 ? generateNoteContainer("neutral", effectsWithNotes, formatEffect) : ''}
        </div>;
}
