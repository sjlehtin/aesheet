var getAllArgsByIndex = function (mockCalls, ind) {
    var list = [];
    for (let call of mockCalls) {
        list.push(call[ind]);
    }
    return list;
};

module.exports = {getAllArgumentsByPosition: getAllArgsByIndex}
