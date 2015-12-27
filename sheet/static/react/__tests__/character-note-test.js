jest.dontMock('../Character');

import React from 'react';
import ReactDOM from 'react-dom';
import TestUtils from 'react-addons-test-utils';

const Character = require('../Character').default;

describe('character note tests', function (){
    "use strict";

    var fetch_prev;
    var mockFetch;
    var mockPromise;

    beforeEach(function () {
        fetch_prev = global.fetch;
        mockFetch = jest.genMockFunction();

        mockPromise = Promise.resolve(
            new Response('{"notes": "this is char pk 42 notes"}', {
                status: 200,
                headers: {
                    'Content-type': 'application/json'
                }
            }));
        mockFetch.mockReturnValue(mockPromise);
        global.fetch = mockFetch;
    });

    afterEach(function () {
        global.fetch = fetch_prev;
    });

    it('starts in non-editing mode', function () {
        var character = TestUtils.renderIntoDocument(
            <Character />
        );
        var characterNode = ReactDOM.findDOMNode(character);

        expect(characterNode.textContent).toContain('Edit');
    });

    it('can change to editing mode by clicking the edit link', function () {
        var character = TestUtils.renderIntoDocument(
            <Character />
        );
        var characterNode = ReactDOM.findDOMNode(character);

        TestUtils.Simulate.click(characterNode.querySelectorAll(
            'a.edit-control')[0]);

        expect(characterNode.textContent).not.toContain('Edit');
    });

    it('can change to editing mode by clicking the text area', function () {
        var character = TestUtils.renderIntoDocument(
            <Character />
        );
        var characterNode = ReactDOM.findDOMNode(character);

        TestUtils.Simulate.click(characterNode.querySelectorAll(
            'pre')[0]);

        expect(characterNode.textContent).not.toContain('Edit');
    });

    it('can start in editing mode', function () {
        var character = TestUtils.renderIntoDocument(
            <Character editing={true} />
        );
        var characterNode = ReactDOM.findDOMNode(character);
        expect(characterNode.textContent).not.toContain('Edit');
    });

    it('updates state on textarea edit', function () {
        var character = TestUtils.renderIntoDocument(
            <Character editing={true} />
        );
        var characterNode = ReactDOM.findDOMNode(character);
        var areaNode = TestUtils.findRenderedDOMComponentWithTag(character,
            "textarea");
        areaNode.value = "new note";
        TestUtils.Simulate.change(areaNode);

        expect(character.state.notes).toEqual("new note");
    });

    it('reverts value on cancel', function () {
        var character = TestUtils.renderIntoDocument(
            <Character editing={true} />
        );
        var characterNode = ReactDOM.findDOMNode(character);
        var areaNode = TestUtils.findRenderedDOMComponentWithTag(character,
            "textarea");
        var originalValue = areaNode.value;
        expect(originalValue).not.toEqual("new note");

        areaNode.value = "new note";
        TestUtils.Simulate.change(areaNode);

        var cancelNode = TestUtils.findRenderedDOMComponentWithTag(character,
            "a");

        TestUtils.Simulate.click(cancelNode);

        expect(character.state.editing).toEqual(false);

        expect(character.state.notes).toEqual(originalValue);
    });


    it('obtains initial data with fetch', function () {
        var character;
        var promiseDelivered = false;

        runs(function () {
            character = TestUtils.renderIntoDocument(
            <Character url="/rest/characters/42" />
            );

            expect(mockFetch.mock.calls[0][0]).toEqual("/rest/characters/42");

            mockPromise.then(function () {
                promiseDelivered = true;
            });
        });

        waitsFor(function () {
            return promiseDelivered === true
        }, "for the backend to be queried", 1000);

        runs(function () {
            var characterNode = ReactDOM.findDOMNode(character);
            expect(characterNode.textContent).toContain('this is char pk 42 notes');
        });
    });

    it('updates state to the server', function () {
        var character;
        var characterNode;

        var promiseDelivered = false;
        var promise2Delivered = false;
        var mockPromise2;

        runs(function () {
            character = TestUtils.renderIntoDocument(
            <Character url="/rest/characters/42" editing={true} />
            );
            var characterNode = ReactDOM.findDOMNode(character);

            expect(mockFetch.mock.calls[0][0]).toEqual("/rest/characters/42");

            mockPromise.then(function () {
                console.log("foo?");
                promiseDelivered = true;
            });
        });

        waitsFor(function () {
            return promiseDelivered === true
        }, "for the backend to be queried", 1000);

        runs(function () {
            console.log("next set");

                mockPromise2 = Promise.resolve(
                    new Response('{}', {
                        status: 200,
                        headers: {
                            'Content-type': 'application/json'
                        }
                    }));
                mockFetch.mockReturnValue(mockPromise2);

                // Cause an update to the backend.
            console.log("was?");

                var areaNode = TestUtils.findRenderedDOMComponentWithTag(
                    character, "textarea");

                TestUtils.Simulate.change(areaNode,
                    {target: {value: "new note"}});

                expect(character.state.notes).toEqual("new note");

            characterNode = ReactDOM.findDOMNode(character);

                var submitButton = characterNode.querySelectorAll(
                    'input[type=submit]')[0];
                console.log("submit:", submitButton);
                TestUtils.Simulate.click(submitButton);

            console.log("progress");

                mockPromise2.then(function () {
            console.log("bar?");
                    promise2Delivered = true;
                });
        });

        waitsFor(function () {
            return promise2Delivered === true
        }, "for the backend to be queried again", 1000);

        runs(function () {
            expect(mockFetch.mock.calls[1][0]).toEqual("/rest/characters/42");
            expect(mockFetch.mock.calls[1][1].body).toContain("new note");

        });
    })
});

