jest.dontMock('../NoteBlock');
jest.dontMock('./factories');

import React from 'react';
import ReactDOM from 'react-dom';
import TestUtils from 'react-addons-test-utils';

var factories = require('./factories');

const NoteBlock = require('../NoteBlock').default;

describe('NoteBlock', function() {
    "use strict";

    var edgeFactory = function (statOverrides) {
        return factories.edgeLevelFactory(statOverrides);
        var _edgeLevelData = {
            "id": 1,
            "notes": "Skudaa",
            "cc_skill_levels": 0,
            "level": 1,
            "cost": 2.0,
            "edge": "Toughness"
        };
        return Object.assign(_edgeLevelData, statOverrides);
    };

    var noteBlockFactory = function(givenProps) {
        var props = {
            edges: []
        };

        if (typeof(givenProps) !== "undefined") {
            props = Object.assign(props, givenProps);
        }
        var block = React.createElement(NoteBlock, props);

        var node = TestUtils.renderIntoDocument(block);
        return TestUtils.findRenderedComponentWithType(node,
            NoteBlock);
    };

    it('can render to a document', function () {
        var block = noteBlockFactory();
        var node = ReactDOM.findDOMNode(block);
        expect(node.tagName).toEqual("DIV");
    });

    it('is empty without edges', function () {
        var block = noteBlockFactory();
        var list = ReactDOM.findDOMNode(block).querySelectorAll('ul');
        expect(list.length).toBe(0);
    });

    it('is empty without edges with notes', function () {
        var block = noteBlockFactory({notes: [edgeFactory({notes: ''})]});
        var list = ReactDOM.findDOMNode(block).querySelectorAll('ul');
        expect(list.length).toBe(0);
    });

    var expectEdgeAndNotes = function (liNodes, edgeName, expectedNotes) {
        expect(liNodes.length).toBe(1);
        var noteNode = liNodes[0];
        expect(noteNode.textContent).toContain(expectedNotes);
        expect(noteNode.textContent).toContain(edgeName);
    };

    it('can contain a list of positive notes', function () {
        var block = noteBlockFactory({edges: [
            edgeFactory({edge: {name: "Skydiving"}, notes: 'skudaa', cost: 2.0})]});

        expect(block.props.edges.length).toEqual(1);

        var ulNodes = ReactDOM.findDOMNode(block)
            .querySelectorAll('ul');
        expect(ulNodes.length).toBe(1);

        expectEdgeAndNotes(ulNodes[0].querySelectorAll('li'), 'Skydiving', 'skudaa');
    });

    it('can contain a list of negative notes', function () {
        var block = noteBlockFactory({edges: [
            edgeFactory({edge: {name: "Skydiving"}, notes: 'skudaa', cost: -2.0})]});

        var ulNodes = ReactDOM.findDOMNode(block)
            .querySelectorAll('ul');
        expect(ulNodes.length).toBe(1);

        expectEdgeAndNotes(ulNodes[0].querySelectorAll('li'), 'Skydiving', 'skudaa');
    });

    it('can contain both positive and negative notes', function () {
        var block = noteBlockFactory({edges: [
            edgeFactory({edge: {name: "Toughness"}, notes: 'uraa', cost: 2.0}),
            edgeFactory({edge: {name: "Skydiving"}, notes: 'skudaa', cost: -2.0})]});
        var ulNodes = ReactDOM.findDOMNode(block).querySelectorAll('ul');
        expect(ulNodes.length).toEqual(2);

        expectEdgeAndNotes(ulNodes[0].querySelectorAll('li'),
            'Toughness', 'uraa');
        expectEdgeAndNotes(ulNodes[1].querySelectorAll('li'),
            'Skydiving', 'skudaa');
    });

    it("can contain effects", function () {
        var block = noteBlockFactory({effects: [{name: "foo", notes: "fam"}]});
        var ulNodes = ReactDOM.findDOMNode(block).querySelectorAll('ul');
        expect(ulNodes.length).toEqual(1);
        expectEdgeAndNotes(ulNodes[0].querySelectorAll('li'),
            'foo', 'fam');

    });
});