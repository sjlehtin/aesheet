import React, { useState } from "react";

import { Button, FormControl } from "react-bootstrap";
import { DecreaseButton, IncreaseButton } from "ModificationButton";

export function WoundRow({ wound, onMod, onRemove, style = {} }) {
  const [editingEffect, setEditingEffect] = useState(false);
  const [effect, setEffect] = useState(wound.effect);

  async function handleKeyDown(e) {
    if (e.code === "Enter") {
      /* Enter. */
      await onMod({
        id: wound.id,
        effect: effect,
      });
      setEditingEffect(false);
    } else if (e.code === "Escape") {
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

  let decreaseButton = "";
  if (wound.healed < wound.damage) {
    decreaseButton = (
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
    );
  }

  const effectField = editingEffect ? (
    <FormControl
      type="text"
      aria-label="Wound effect"
      onChange={(e) => setEffect(e.target.value)}
      onKeyDown={handleKeyDown}
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
