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

function defer() {
    var res, rej;

    var promise = new Promise((resolve, reject) => {
        res = resolve;
        rej = reject;
    });

    promise.resolve = res;
    promise.reject = rej;

    return promise;
}

export {getAllArgumentsByPosition, TableWrapper, defer};
