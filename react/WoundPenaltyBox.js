import React from 'react';
import PropTypes from 'prop-types';
import SkillHandler from "SkillHandler";

class WoundPenaltyBox extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        var penalties = this.props.handler.getWoundPenalties();
        var penaltyCells = [];

        var stats = this.props.handler.getBaseStats();

        var noteStyle = {
            fontSize: "80%",
            fontStyle: "italic",
            marginLeft: "1em",
            color: "gray"
        };

        const excessPenalties = {}
        for (const stat of SkillHandler.baseStatNames) {
            excessPenalties[stat] = stats[stat] < -penalties.aa;
        }

        console.log(excessPenalties)
        if (excessPenalties.fit) {
            penaltyCells.push(<span>Heart stopped (FIT below zero)<span style={noteStyle}>Body must be healed sufficiently to counter the penalty. Chance of severe permanent brain damage is 2% per minute.</span></span>);
        }

        if (excessPenalties.ref) {
            penaltyCells.push(<span>Paralyzed (REF below zero)</span>);
        }
        if (excessPenalties.wil) {
            penaltyCells.push(<span>Unconscious (WIL below zero)</span>);
        }

        let shockedExceeds = []
        for (const stat of ["int", "lrn", "psy"]) {
            if (excessPenalties[stat]) {
                shockedExceeds.push(stat.toUpperCase())
            }
        }
        if (shockedExceeds.length > 0) {
            penaltyCells.push(<span>Shocked ({`${shockedExceeds.join(',')}`} below zero)<span style={noteStyle}>Shocked PCs may continue combat, if they succeed in their WIL check (due to lethal wound) not counting shock modifiers.</span></span>);
        }

        if (penalties.aa !== 0) {
            penaltyCells.push(<span>{penalties.aa} AA</span>);
        }
        if (penalties.mov !== 0) {
            penaltyCells.push(<span>{penalties.mov} MOV</span>);
        }

        if (penalties.ra_fit_ref !== 0) {
            var newVar = {fontSize: "small", marginLeft: "1em"};
            penaltyCells.push(<span>RA {penalties.ra_fit_ref} FIT/REF<span
                style={noteStyle}>
                (effect not applied to checks)
            </span></span>);
        }

        if (penalties.la_fit_ref !== 0) {
            penaltyCells.push(<span>LA {penalties.la_fit_ref} FIT/REF<span
                style={noteStyle}>
                (effect not applied to checks)
            </span></span>);
        }

        var content = '';
        if (penaltyCells.length > 0) {
            content = <div>
                <div style={{fontWeight: "bold"}}>From wounds</div>
                <div style={{color: "red"}}>
                    {penaltyCells.map((el, idx) => {
                        return <div key={"pen-" + idx}>{el}</div>
                    })}
                </div>
            </div>;
        }
        return <div>{content}</div>;
    }
}

WoundPenaltyBox.propTypes = {
    handler: PropTypes.object.isRequired,
};

export default WoundPenaltyBox;
