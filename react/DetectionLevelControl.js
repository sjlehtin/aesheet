import React, { useState } from "react";
import { FloatingLabel, Form } from "react-bootstrap";

export default function DetectionLevelControl({
  initialDetectionLevel,
  onChange,
}) {
  const [selected, setSelected] = useState(initialDetectionLevel);
  const detectionLevels = [
    { detectionLevel: 0, description: "Clear" },
    { detectionLevel: -1, description: "Dusk" },
    { detectionLevel: -2, description: "Artificial light" },
    { detectionLevel: -3, description: "Moonlight" },
    { detectionLevel: -4, description: "Darkness" },
    { detectionLevel: -5, description: "Darkness in Shelob's lair" },
    { detectionLevel: -6, description: "Darkness in Barad-dûr" },
    { detectionLevel: -7, description: "Pitch black" },
  ];
  return (
    <>
      <FloatingLabel controlId="darkness-dl-control" label="Darkness DL">
        <Form.Select
          aria-label="Darkness DL"
          value={selected}
          onChange={(e) => {
            setSelected(e.target.value);
            onChange(parseInt(e.target.value));
          }}
        >
          {detectionLevels.map((dl, index) => {
            return (
              <option
                key={index}
                value={dl.detectionLevel}
              >{`${dl.description} (${dl.detectionLevel})`}</option>
            );
          })}
        </Form.Select>
      </FloatingLabel>
    </>
  );
}
