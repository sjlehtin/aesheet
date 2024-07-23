import React from "react";
import { CSSProperties } from "react";

import Button from "react-bootstrap/Button"
import FormControl from "react-bootstrap/FormControl"
import { DecreaseButton, IncreaseButton } from "./ModificationButton";

interface Wound {
  id: number;
  effect: string;
  damage: number;
  healed: number;
  location: string;
  damage_type: string;
}

interface WoundChange {
  id: number;
  effect?: string;
  damage?: number;
  healed?: number;
  location?: string;
  damage_type?: string;
}

export function WoundRow({
  wound,
  onMod,
  onRemove,
  style = {},
}: {
  wound: Wound;
  style?: CSSProperties;
  onRemove: (wound: WoundChange) => Promise<void>;
  onMod: (wound: WoundChange) => Promise<void>;
}) {
  const [editingEffect, setEditingEffect] = React.useState(false);
  const [effect, setEffect] = React.useState(wound.effect);

  async function handleKeyDown(code: string) {
    if (code === "Enter") {
      /* Enter. */
      await onMod({
        id: wound.id,
        effect: effect,
      });
      setEditingEffect(false);
    } else if (code === "Escape") {
      /* Escape. */
      setEffect(wound.effect);
      setEditingEffect(false);
    }
  }

  const worsenButton = (
    <IncreaseButton
      style={{ color: "red" }}
      onClick={() =>
        onMod({
          id: wound.id,
          damage: wound.damage + 1,
        })
      }
      name={"Increase damage"}
    />
  );

  const decreaseButton =
    wound.healed < wound.damage ? (
      <DecreaseButton
        style={{ color: "green" }}
        onClick={() =>
          onMod({
            id: wound.id,
            healed: wound.healed + 1,
          })
        }
        name={"Decrease damage"}
      />
    ) : (
      ""
    );

  const effectField = editingEffect ? (
    <FormControl
      type="text"
      aria-label="Wound effect"
      onChange={(e) => setEffect(e.target.value)}
      onKeyDown={(e) => handleKeyDown(e.code)}
      onClick={(c) => c.stopPropagation()}
      value={effect}
    />
  ) : (
    wound.effect
  );

  return (
    <tr style={style}>
      <td>{wound.location}</td>
      <td>{wound.damage_type}</td>
      <td aria-label={"Current wound damage"}>
        {wound.damage - wound.healed}
        <span style={{ position: "relative" }}>
          {worsenButton}
          {decreaseButton}
        </span>
      </td>
      <td
        aria-label={"Wound effect"}
        onClick={() => setEditingEffect(!editingEffect)}
      >
        {effectField}
      </td>
      <td style={{ width: "3em" }}>
        <Button size="sm" onClick={() => onRemove({ id: wound.id })}>
          Heal
        </Button>
      </td>
    </tr>
  );
}

export default WoundRow;
