import React from 'react';

import NoteBlock from 'NoteBlock'

import * as factories from './factories'

import {render, waitFor, waitForElementToBeRemoved, screen, within} from '@testing-library/react'

describe('NoteBlock', function() {
    it('is empty without edges', function () {
        render(<NoteBlock />)

        expect(screen.queryByRole("list")).toEqual(null)
    });

    it('is empty without edges with notes', function () {
        render(<NoteBlock edges={[factories.edgeLevelFactory({edge: {name: "Skydiving"}, notes: '', cost: 2.0})]}/>)

        expect(screen.queryByRole("list")).toEqual(null)
    });

    it('can contain a list of positive notes', function () {
        render(<NoteBlock edges={[factories.edgeLevelFactory({edge: {name: "Skydiving"}, notes: 'skudaa', cost: 2.0})]}/>)

        expect(screen.getByLabelText("positive notes").textContent).toContain("Skydiving")
        expect(screen.getByLabelText("positive notes").textContent).toContain("skudaa")
    });

    it('can contain a list of negative notes', function () {
        render(<NoteBlock edges={[factories.edgeLevelFactory({edge: {name: "Skydiving"}, notes: 'skudaa', cost: -2.0})]}/>)

        expect(screen.getByLabelText("negative notes").textContent).toContain("Skydiving")
        expect(screen.getByLabelText("negative notes").textContent).toContain("skudaa")
    });

    it('can contain both positive and negative notes', function () {
        render(<NoteBlock edges={[
            factories.edgeLevelFactory({edge: {name: "Toughness"}, notes: 'uraa', cost: 2.0}),
            factories.edgeLevelFactory({edge: {name: "Skydiving"}, notes: 'skudaa', cost: -2.0})]}/>)

        expect(screen.getByLabelText("negative notes").textContent).toContain("Skydiving")
        const positive = screen.getByLabelText("positive notes").textContent;
        expect(positive).toContain("Toughness")
        expect(positive).toContain("uraa")
    });

    it("can contain effects", function () {
        render(<NoteBlock effects={[{name: "foo", notes: "fam"}]}/>)

        const positive = screen.getByLabelText("neutral notes").textContent;
        expect(positive).toContain("foo")
        expect(positive).toContain("fam")
    });

});