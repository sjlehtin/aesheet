import React, { CSSProperties } from "react";

import { Button } from "react-bootstrap";

import * as util from './sheet-util';

function isValid(value: string) {
  return util.isInt(value);
}

export function AddSPControl({
  initialAgeSP,
  onAdd,
}: {
  initialAgeSP: number;
  onAdd: (sp: number) => Promise<void>;
}) {
  const [ageSP, setAgeSP] = React.useState(initialAgeSP.toString());

  let inputStyle: CSSProperties = {
    textAlign: "right",
    marginRight: 5,
    marginLeft: 5,
    width: "4em",
  };

  if (!isValid(ageSP)) {
    inputStyle.color = "red";
  }

  function handleSubmit() {
    if (isValid(ageSP)) {
      const promise = onAdd(parseInt(ageSP));
      setAgeSP(initialAgeSP.toString())
      return promise;
    }
  }

  return (
    <div title="Age SP is added every five adventures">
      <label>Age SP:</label>
      <input
        type="text"
        onChange={(e) => setAgeSP(e.target.value)}
        value={ageSP}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            /* Enter. */
            return handleSubmit();
          }
        }}
        style={inputStyle}
      />
      <Button
        size="sm"
        disabled={!isValid(ageSP)}
        onClick={() => handleSubmit()}
      >
        Add SP
      </Button>
    </div>
  );
}

export default AddSPControl;
