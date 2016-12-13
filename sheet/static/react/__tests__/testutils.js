import React from 'react';

var getAllArgumentsByPosition = function (mockCalls, ind) {
    var list = [];
    for (let call of mockCalls) {
        list.push(call[ind]);
    }
    return list;
};

class TableWrapper extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return <table>
            <tbody>{this.props.children}</tbody>
        </table>;
    }
}

export {getAllArgumentsByPosition, TableWrapper};
