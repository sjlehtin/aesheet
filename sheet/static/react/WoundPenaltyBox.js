import React from 'react';

class WoundPenaltyBox extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        var penalties = this.props.handler.getWoundPenalties();
        var penaltyCells = [];
        if (penalties.aa != 0) {
            penaltyCells.push(<span>{penalties.aa} AA</span>);
        }
        if (penalties.mov != 0) {
            penaltyCells.push(<span>{penalties.mov} MOV</span>);
        }

        var noteStyle = {
            fontSize: "small",
            marginLeft: "1em"
        };

        if (penalties.ra_fit_ref != 0) {
            var newVar = {fontSize: "small", marginLeft: "1em"};
            penaltyCells.push(<span>RA {penalties.ra_fit_ref} FIT/REF<span
                style={noteStyle}>
                (effect not applied to checks)
            </span></span>);
        }

        if (penalties.la_fit_ref != 0) {
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
    handler: React.PropTypes.object.isRequired,
};

export default WoundPenaltyBox;
