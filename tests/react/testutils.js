import {screen, within} from "@testing-library/react";

function defer() {
    let res, rej;

    let promise = new Promise((resolve, reject) => {
        res = resolve;
        rej = reject;
    });

    promise.resolve = res;
    promise.reject = rej;

    return promise;
}

function getSenseChecks(checkLabel) {
    let values = []
    within(screen.getByLabelText(checkLabel)).queryAllByRole("cell", {name: "check"}).forEach((el) => {
        values.push(parseInt(el.textContent))
    })
    return values;
}


export {defer, getSenseChecks};
