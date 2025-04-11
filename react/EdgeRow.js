import React from "react";

import { Button, FormCheck } from "react-bootstrap";

export function EdgeRow({ edge, onRemove, onChange, style }) {
  let restPayload = { id: edge.id };

  return (
    <tr style={style} title={edge.edge.edge.description}>
      <td>
        {edge.edge.edge.name} {edge.edge.level}
      </td>
      <td>
        <span>
          {edge.edge.cost}
          {edge.ignore_cost === true ? "*" : ""}
        </span>
      </td>
      <td>
        <span>
          <FormCheck
            aria-label={"Ignore cost"}
            tabIndex={0}
            onChange={(e) => {
              onChange(
                Object.assign(restPayload, {
                  ignore_cost: !edge.ignore_cost,
                }),
              );
            }}
            checked={edge.ignore_cost}
            type={"checkbox"}
            value={edge.ignore_cost}
          />
        </span>
      </td>
      <td>
        <Button
          style={{ float: "right", paddingRight: 5 }}
          size={"sm"}
          onClick={(e) => {
            onRemove(restPayload);
          }}
        >
          Remove
        </Button>
      </td>
    </tr>
  );
}

export default EdgeRow;
