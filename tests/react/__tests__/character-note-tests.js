jest.dontMock('CharacterNotes');

import React from 'react';
import ReactDOM from 'react-dom';
import TestUtils from 'react-dom/test-utils';

var rest = require('sheet-rest');

import CharacterNotes from 'CharacterNotes';

describe('character note tests', function (){
    "use strict";

    var promises;

    var patchOk = function () {
        var response = Promise.resolve({});
        rest.patch.mockReturnValue(response);
        promises.push(response);
    };

    beforeEach(function () {
        var mockPromise = Promise.resolve({"notes": "this is char pk 42 notes"});
        rest.getData = jest.fn();
        rest.patch = jest.fn();
        rest.getData.mockReturnValue(mockPromise);
        promises = [];
        promises.push(mockPromise);
    });

    it('starts in non-editing mode', function () {
        var character = TestUtils.renderIntoDocument(
            <CharacterNotes />
        );
        var characterNode = ReactDOM.findDOMNode(character);

        expect(characterNode.textContent).toContain('Edit');
    });

    it('can change to editing mode by clicking the edit link', function () {
        var character = TestUtils.renderIntoDocument(
            <CharacterNotes />
        );
        var characterNode = ReactDOM.findDOMNode(character);

        TestUtils.Simulate.click(characterNode.querySelectorAll(
            'a.edit-control')[0]);

        expect(characterNode.textContent).not.toContain('Edit');
    });

    it('can change to editing mode by clicking the text area', function () {
        var character = TestUtils.renderIntoDocument(
            <CharacterNotes />
        );
        expect(character.state.editing).not.toEqual(true);

        var areaNode = TestUtils.findRenderedDOMComponentWithTag(character,
            "textarea");
        TestUtils.Simulate.click(areaNode);

        expect(character.state.editing).toEqual(true);
    });

    it('can start in editing mode', function () {
        var character = TestUtils.renderIntoDocument(
            <CharacterNotes initialEditing={true} />
        );
        var characterNode = ReactDOM.findDOMNode(character);
        expect(characterNode.textContent).not.toContain('Edit');
    });

    it('updates state on textarea edit', function () {
        var character = TestUtils.renderIntoDocument(
            <CharacterNotes initialEditing={true} />
        );
        var areaNode = TestUtils.findRenderedDOMComponentWithTag(character,
            "textarea");
        areaNode.value = "new note";
        TestUtils.Simulate.change(areaNode);

        expect(character.state.notes).toEqual("new note");
    });

    it('reverts value on cancel', function () {
        var character = TestUtils.renderIntoDocument(
            <CharacterNotes initialEditing={true} />
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


    it('obtains initial data with fetch', function (done) {
        var character = TestUtils.renderIntoDocument(
            <CharacterNotes url="/rest/characters/42" />
        );

        Promise.all(promises).then(function () {
            expect(rest.getData.mock.calls[0][0]).toEqual("/rest/characters/42");
            expect(character.state.notes).toContain('this is char pk 42 notes');
            done();
        });
    });

    it('updates state to the server', function (done) {
        var character;

        character = TestUtils.renderIntoDocument(
            <CharacterNotes url="/rest/characters/42" initialEditing={true} />
        );

        // TODO: seems to work without this, probably because no asserts
        // require that the promise would be delivered successfully.
        patchOk();

        Promise.all(promises).then(function () {
            expect(rest.getData.mock.calls[0][0]).toEqual("/rest/characters/42");

            var areaNode = TestUtils.findRenderedDOMComponentWithTag(
                character, "textarea");

            TestUtils.Simulate.change(areaNode,
                {target: {value: "new note"}});

            expect(character.state.notes).toEqual("new note");

            var submitButton= TestUtils.findRenderedDOMComponentWithTag(
                character, "input");

            TestUtils.Simulate.click(submitButton);

            expect(rest.patch.mock.calls[0][0]).toEqual("/rest/characters/42");
            expect(rest.patch.mock.calls[0][1]).toEqual({notes: "new note"});

        }).then(function () {
            expect(character.state.editing).toEqual(false);
            done();
        });
    });
});

