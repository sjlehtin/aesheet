import React, { CSSProperties } from "react";

import { Button, Form, FormControl, Modal } from "react-bootstrap";

import * as util from "./sheet-util";

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
  const [showDialog, setShowDialog] = React.useState(false);

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
      setAgeSP(initialAgeSP.toString());
      setShowDialog(false);
      return promise;
    }
  }

  function cancelEdit() {
    setShowDialog(false);
    setAgeSP(initialAgeSP.toString());
  }

  return (
    <div title="Age SP is added every five adventures">
      <label>Age SP:</label>
      <span style={{ paddingRight: "5px" }}>{initialAgeSP}</span>
      <Button size="sm" onClick={() => setShowDialog(true)}>
        Add SP
      </Button>

      <Modal
        title={"Add SP"}
        show={showDialog}
        onHide={() => {
          cancelEdit();
        }}
        onKeyDown={(e: KeyboardEvent) => {
          if (e.key === "Escape") {
            e.preventDefault();
            cancelEdit();
          }
        }}
      >
        <Modal.Header closeButton={true}>
          <Modal.Title>Add XP</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Label id={"add-sp-input"}>Add SP</Form.Label>

          <FormControl
            type="text"
            name={"add-sp-input"}
            aria-labelledby={"add-sp-input"}
            autoFocus
            onChange={(e) => setAgeSP(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                /* Enter. */
                return handleSubmit();
              }
            }}
            isValid={isValid(ageSP)}
            className="col-xs-2"
            value={ageSP}
          />
        </Modal.Body>
        <Modal.Footer>
          <Button
            onClick={() => {
              return handleSubmit();
            }}
            disabled={!isValid(ageSP)}
            variant="primary"
          >
            Add
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default AddSPControl;
