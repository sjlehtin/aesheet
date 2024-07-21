import React, {useState} from "react";
import {Col, Form, Row} from "react-bootstrap";

export default function CloseCombatToggle({ initialValue, onToggle }) {
  const [checked, setChecked] = useState(initialValue);
  return (
    <Row>
        <Col>
          <Form.Check
              id="close-combat-toggle"
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
    </Row>
  );
}