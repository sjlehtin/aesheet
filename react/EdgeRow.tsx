import { Button, FormCheck } from "react-bootstrap";
import { CharacterEdge } from "./api";
import { CSSProperties } from "react";

interface PartialCharacterEdge {
  id: number;
  ignore_cost?: boolean;
}

export function EdgeRow({
  edge,
  onRemove,
  onChange,
  style,
}: {
  edge: CharacterEdge;
  onRemove: (el: PartialCharacterEdge) => Promise<void>;
  onChange: (el: PartialCharacterEdge) => Promise<void>;
  style: CSSProperties;
}) {
  let restPayload = { id: edge.id };

  return (
    <tr style={style} title={edge.edge.edge.description}>
      <td>
        {edge.edge.edge.name} {edge.edge.level}
      </td>
      <td>
        <span>
          {edge.edge.cost}
          {edge.ignore_cost ? "*" : ""}
        </span>
      </td>
      <td>
        <span>
          <FormCheck
            aria-label={"Ignore cost"}
            tabIndex={0}
            onChange={() => {
              return onChange(
                Object.assign(restPayload, {
                  ignore_cost: !edge.ignore_cost,
                }),
              );
            }}
            checked={edge.ignore_cost}
            type={"checkbox"}
          />
        </span>
      </td>
      <td>
        <Button
          style={{ float: "right", paddingRight: 5 }}
          size={"sm"}
          onClick={async () => {
            return onRemove(restPayload);
          }}
        >
          Remove
        </Button>
      </td>
    </tr>
  );
}

export default EdgeRow;
