import React from "react";

import StatBlock from "StatBlock";
import {
  render,
  screen,
  waitFor,
  waitForElementToBeRemoved,
  within,
} from "@testing-library/react";
import { rest } from "msw";
import { setupServer } from "msw/node";
import userEvent from "@testing-library/user-event";
import { testSetup } from "./testutils";

import * as factories from "./factories";

const server = setupServer(
  rest.get("http://localhost/rest/sheets/1/", (req, res, ctx) => {
    return res(ctx.json(factories.sheetFactory()));
  }),
  rest.get("http://localhost/rest/sheets/1/*/", (req, res, ctx) => {
    return res(ctx.json([]));
  }),
  rest.get("http://localhost/rest/characters/2/", (req, res, ctx) => {
    return res(
      ctx.json(
        factories.characterFactory({
          name: "Grok the Barbarian",
          free_edges: 1,
          cur_wil: 53,
          cur_psy: 42,
          bought_mana: 5,
        }),
      ),
    );
  }),
  rest.get("http://localhost/rest/edgelevels/campaign/2/", (req, res, ctx) => {
    return res(
      ctx.json([]),
    );
  }),

  rest.get("http://localhost/rest/skills/campaign/2/", (req, res, ctx) => {
    return res(
      ctx.json([
        factories.skillFactory({
          name: "Gardening",
          skill_cost_0: 1,
          skill_cost_1: 1,
          skill_cost_2: 2,
          skill_cost_3: 3,
        }),
        factories.skillFactory({
          name: "Cooking",
          skill_cost_0: 1,
          skill_cost_1: 1,
          skill_cost_2: 2,
          skill_cost_3: 3,
        }),
        factories.skillFactory({
          name: "Steaks",
          is_specialization: true,
          skill_cost_0: 0,
          skill_cost_1: 2,
          required_skills: ["Cooking"],
        }),
      ]),
    );
  }),

  rest.get("http://localhost/rest/*/campaign/2/", (req, res, ctx) => {
    return res(ctx.json([]));
  }),
  rest.get("http://localhost/rest/characters/2/*/", (req, res, ctx) => {
    return res(ctx.json([]));
  }),
);

describe("StatBlock - skills", function () {
  beforeAll(() => {
    testSetup();
    server.listen({ onUnhandledRequest: "error" });
  });
  afterEach(() => {
    server.resetHandlers();
    factories.clearAll();
  });
  afterAll(() => server.close());

  it("can load the sheet and perform skill edits", async function () {
    const user = userEvent.setup();

    const gardening = factories.skillFactory("Gardening");

    server.use(
      rest.get(
        "http://localhost/rest/characters/2/characterskills/",
        (req, res, ctx) => {
          const skill = factories.characterSkillFactory({
            skill: 42,
            skill__name: "Gardening",
            level: 2,
            id: 300,
          });
          const skill2 = factories.characterSkillFactory({
            skill: 43,
            skill__name: "Cooking",
            level: 1,
            id: 301,
          });
          const skill3 = factories.characterSkillFactory({
            skill: 44,
            skill__name: "Steaks",
            level: 1,
            id: 302,
          });
          return res(ctx.json([skill, skill2, skill3]));
        },
      ),
    );

    render(<StatBlock url="/rest/sheets/1/" />);
    await waitForElementToBeRemoved(document.querySelector("#loading"), {
      timeout: 5000,
    });

    expect(screen.getByText("Cooking")).toBeInTheDocument();

    let values = [];
    server.use(
      rest.delete(
        "http://localhost/rest/characters/2/characterskills/300/",
        (req, res, ctx) => {
          values.push(true);
          return res(ctx.json({}));
        },
      ),
    );

    const row = screen.getByText("Gardening").closest("tr");
    const removeButton = within(row).getByLabelText("Remove skill");
    await user.click(removeButton);

    // The delete endpoint should have triggered.
    expect(values[0]).toBe(true);

    await waitFor(() => expect(screen.queryByText("Gardening")).toBe(null));

    console.log("gardening deleted")

    const skillInput = within(
      screen.getByLabelText("Add skill name"),
    ).getByRole("combobox");
    await user.clear(skillInput);
    await user.type(skillInput, "gard");
    await user.click(screen.getByText("Gardening"));

    const csSkillData = {
      id: 422,
      skill: gardening.id,
      skill__name: "Gardening",
      level: 0,
    };

    server.use(
      rest.post(
        "http://localhost/rest/characters/2/characterskills/",
        async (req, res, ctx) => {
          const json = await req.json();
          expect(json.skill).toEqual(gardening.id);
          expect(json.level).toEqual(0);
          return res(ctx.json(csSkillData));
        },
      ),
      rest.patch(
        "http://localhost/rest/characters/2/characterskills/422",
        async (req, res, ctx) => {
          return res(
            ctx.json(Object.assign({}, csSkillData, await req.json())),
          );
        },
      ),
      rest.delete(
        "http://localhost/rest/characters/2/characterskills/422/",
        (req, res, ctx) => {
          return res(ctx.json({}));
        },
      ),
    );

    await user.click(screen.getByRole("button", { name: "Add skill" }));

    console.log("gardening added")

    const skillTableElement = await screen.findByRole("table", {
      name: "Skills",
    });
    const newRow = (
      await within(skillTableElement).findByText("Gardening")
    ).closest("tr");
    expect(newRow).toBeInTheDocument();

    await user.click(
      within(newRow).getByRole("button", { name: "Increase skill level" }),
    );

    await waitFor(() =>
      expect(within(newRow).getByLabelText("Skill level").textContent).toEqual(
        "1",
      ),
    );

    await user.click(
      within(newRow).getByRole("button", { name: "Decrease skill level" }),
    );
    await waitFor(() =>
      expect(within(newRow).getByLabelText("Skill level").textContent).toEqual(
        "0",
      ),
    );

    expect(
      within(screen.getByRole("table", { name: "Skills" })).queryByText(
        "Gardening",
      ),
    ).not.toBe(null);

    await user.click(
      within(newRow).getByRole("button", { name: "Remove skill" }),
    );

    await waitFor(() =>
      expect(
        within(screen.getByRole("table", { name: "Skills" })).queryByText(
          "Gardening",
        ),
      ).toBe(null),
    );

    const cookings = await within(skillTableElement).findAllByText("Cooking");
    expect(cookings.length).toEqual(1);

    const steaks = await within(skillTableElement).findAllByText("Steaks");
    expect(steaks.length).toEqual(1);
  });
});
