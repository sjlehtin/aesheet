import React from 'react';

import { screen, render, within } from '@testing-library/react'

import SenseTable from 'SenseTable'
import * as factories from './factories'

export function getSenseChecks(checkLabel) {
    return getSenseCheckNodes(checkLabel).map((el) => parseInt(el.textContent))
}

function getSenseCheckNodes(checkLabel) {
    let elements = []
    within(screen.getByLabelText(checkLabel)).queryAllByRole("cell", {name: "check"}).forEach((el) => {
        elements.push(el)
    })
    return elements;
}

describe('SenseTable', function() {
    let getSenseTable = function (givenProps) {
        let props = givenProps;
        if (!props) {
            props = {};
        }
        props.handler = factories.skillHandlerFactory(givenProps);
        return render(<SenseTable {...props} />)
    };

    it('displays vision checks', function () {
        getSenseTable({character: {cur_int: 50},
            edges: [{edge: "Acute Vision", level: 1}]});

        const checks = getSenseChecks("Day vision")
        expect(checks[checks.length - 1]).toEqual(50);
        // Distance of 2k with Acute Vision.
        expect(checks.length).toEqual(10);
    });

    it('indicates ranged check penalty and bumping allowed', function () {
        getSenseTable({character: {cur_int: 50},
            edges: [{edge: "Acute Vision", level: 1}]});

        const nodes = getSenseCheckNodes("Day vision")
        expect(nodes[0].children[0].getAttribute("role")).toEqual("strong")
        expect(nodes[nodes.length - 1].children[0].getAttribute("role")).toEqual("emphasis")
    });

    it('displays hearing checks with Poor Hearing', function () {
        getSenseTable({character: {cur_int: 50}});

        const checks = getSenseChecks("Hearing")
        expect(checks[checks.length - 1]).toEqual(50);
        // Distance of 100m by default.
        expect(checks.length).toEqual(6);

        const smellChecks = getSenseChecks("Smell")
        // Distance of 10m by default.
        expect(smellChecks.length).toEqual(3);
    });

    it('displays hearing checks with Poor Hearing', function () {
        getSenseTable({character: {cur_int: 50},
            edges: [{edge: "Poor Hearing", level: 1}]});

        const checks = getSenseChecks("Hearing")
        expect(checks[checks.length - 1]).toEqual(50);
        // Distance of 50m with Poor Hearing.
        expect(checks.length).toEqual(5);
    });

    it('displays hearing checks with Acute Hearing', function () {
        getSenseTable({character: {cur_int: 50},
            edges: [{edge: "Acute Hearing", level: 1}]});

        const checks = getSenseChecks("Hearing")
        expect(checks[checks.length - 1]).toEqual(50);
        // Distance of 200m with Poor Hearing.
        expect(checks.length).toEqual(7);

        const smellChecks = getSenseChecks("Smell")
        // Distance of 10m by default.
        expect(smellChecks.length).toEqual(3);
    });

    it('displays smell checks', function () {
        getSenseTable({character: {cur_int: 50}});

        const checks = getSenseChecks("Smell")
        expect(checks[checks.length - 1]).toEqual(50);
        // Distance of 10m by default.
        expect(checks.length).toEqual(3);
    });

    it('displays smell checks with Acute Smell and Taste', function () {
        getSenseTable({character: {cur_int: 50},
                edges: [{edge: "Acute Smell and Taste", level: 1}]});

        const checks = getSenseChecks("Smell")
        expect(checks[checks.length - 1]).toEqual(50);
        // Distance of 20m with edge.
        expect(checks.length).toEqual(4);
    });

    it('displays touch check', function () {
        getSenseTable({character: {cur_int: 50}});

        const checks = getSenseChecks("Touch")
        expect(checks[checks.length - 1]).toEqual(50);
        // Just one check (close).
        expect(checks.length).toEqual(1);
    });

    it('displays single touch check with Acute Touch', function () {
        getSenseTable({character: {cur_int: 50},
            edges: [{edge: "Acute Touch", level: 1}]});

        const checks = getSenseChecks("Touch")
        expect(checks[checks.length - 1]).toEqual(50);
        // Just one check (close).
        expect(checks.length).toEqual(1);
    });

    it('displays surprise check', function () {
        getSenseTable({character: {cur_psy: 50}});

        const checks = getSenseChecks("Surprise")
        expect(checks[checks.length - 1]).toEqual(50);
        // Just one check (close).
        expect(checks.length).toEqual(1);
    });

    it('add surprise skill to surprise check', function () {
        getSenseTable({character: {cur_psy: 50},
            skills: [factories.characterSkillFactory({skill: "Tailing / Shadowing", level: 1})]});

        const checks = getSenseChecks("Surprise")
        expect(checks[checks.length - 1]).toEqual(55);
        // Just one check (close).
        expect(checks.length).toEqual(1);
    });

    it('displays night vision checks for DL -2', function () {
        getSenseTable({character: {cur_int: 50}});

        const checks = getSenseChecks("Night Vision DL -2")
        expect(checks[checks.length - 1]).toEqual(30);
        // 1k => 9, DL -2 => 7.
        expect(checks.length).toEqual(7);
    });

    it('displays night vision checks for DL -2 with Night Vision 3', function () {
        getSenseTable({character: {cur_int: 50},
                    edges: [{edge: "Night Vision", level: 3}]});

        const checks = getSenseChecks("Night Vision DL -2")
        expect(checks[checks.length - 1]).toEqual(50);
        // 1k => 9, DL -2 => 7.
        expect(checks.length).toEqual(9);
    });

    it('displays night vision checks for DL -4 with Night Vision 2 and Acute Vision 2', function () {
        getSenseTable({character: {cur_int: 50},
                    edges: [{edge: "Night Vision", level: 2}, {edge: "Acute Vision", level: 2}]});

        const checks = getSenseChecks("Night Vision DL -4")
        expect(checks[checks.length - 1]).toEqual(30);
        // 1k => 9, DL -2 + 1 => 8.
        expect(checks.length).toEqual(8);
    });

    it('recognizes total darkness', function () {
        getSenseTable({character: {cur_int: 50},
                    edges: [{edge: "Night Vision", level: 3}]});

        const checks = getSenseChecks("Night Vision DL -7")
        expect(checks.length).toEqual(0);
    });

    it('recognizes total darkness with darkvision', function () {
        getSenseTable({character: {cur_int: 50},
                    edges: [{edge: "Night Vision", level: 4}]});

        const checks = getSenseChecks("Night Vision DL -7")
        expect(checks[checks.length - 1]).toEqual(20);
        // 1k => 9, total DL -3 => 6.
        expect(checks.length).toEqual(6);
    });
});