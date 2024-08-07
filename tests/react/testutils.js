import {screen, within} from "@testing-library/react";
import * as factories from './factories'

function testSetup() {
    // Required for Offcanvas component in react-bootstrap.
    Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
            matches: false,
            media: query,
            onchange: null,
            addListener: jest.fn(), // deprecated
            removeListener: jest.fn(), // deprecated
            addEventListener: jest.fn(),
            removeEventListener: jest.fn(),
            dispatchEvent: jest.fn(),
        })),
    })

    // @headlessui/react
    Object.defineProperty(window, 'ResizeObserver', {
        value: jest.fn().mockImplementation(query => ({
            observe: jest.fn(),
            disconnect: jest.fn()
        }))
    })

    factories.clearAll()
}

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

export {defer, testSetup};
