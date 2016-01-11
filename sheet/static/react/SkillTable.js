import React from 'react';
import ReactDOM from 'react-dom';

var rest = require('sheet-rest');

import {Table} from 'react-bootstrap';
import SkillRow from 'SkillRow';

class SkillTable extends React.Component {
    constructor(props) {
        super(props);

        this.state = { };
    }

    componentDidMount() {
        //rest.getData('skills')
    }
    render () {
        var rows = [];
        for (var ii = 0; ii < this.props.characterSkills.length; ii++) {
            rows.push(<SkillRow
                key={this.props.characterSkills[ii].id}
                stats={this.props.stats}
                characterSkill={this.props.characterSkills[ii]}
                allSkills={this.props.allSkills} />);
        }
        return <Table>{rows}</Table>;
    }
}

SkillTable.propTypes = {
    characterSkills: React.PropTypes.array.isRequired,
    allSkills: React.PropTypes.array.isRequired,
    stats: React.PropTypes.object.isRequired
};

export default SkillTable;

