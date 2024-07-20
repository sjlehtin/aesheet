import React, {useState} from "react";
import {Col, Form, Row} from "react-bootstrap";

export default function CloseCombatToggle({ inCloseCombat, onToggle }) {
  const [checked, setChecked] = useState(inCloseCombat);
  return (
    <Row>
      <Form.Group as={Row}>
        <Col>
          {/*<Form.Label id={"close-combat-toggle-label"}>*/}
          {/*  In close combat*/}
          {/*</Form.Label>*/}
          <Form.Check
            size="sm"
            type="checkbox"
            label="In close combat"
            aria-label="In close combat"
            onChange={(e) => {
              setChecked(e.target.checked);
              onToggle(e.target.checked);
            }}
            checked={checked}
          />
        </Col>
      </Form.Group>
    </Row>
  );
}