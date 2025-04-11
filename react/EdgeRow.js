import React from "react";

import PropTypes from "prop-types";

import { Button, FormCheck } from "react-bootstrap";

class EdgeRow extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    let restPayload = { id: this.props.edge.id };

    return (
      <tr
        style={this.props.style}
        title={this.props.edge.edge.edge.description}
      >
        <td>
          {this.props.edge.edge.edge.name} {this.props.edge.edge.level}
        </td>
        <td>
          <span>
            {this.props.edge.edge.cost}
            {this.props.edge.ignore_cost === true ? "*" : ""}
          </span>
        </td>
        <td>
          <span>
            <FormCheck
              aria-label={"Ignore cost"}
              tabIndex={0}
              onChange={(e) => {
                this.props.onChange(
                  Object.assign(restPayload, {
                    ignore_cost: !this.props.edge.ignore_cost,
                  }),
                );
              }}
              checked={this.props.edge.ignore_cost}
              type={"checkbox"}
              value={this.props.edge.ignore_cost}
            />
          </span>
        </td>
        <td>
          <Button
            style={{ float: "right", paddingRight: 5 }}
            size={"sm"}
            onClick={(e) => {
              this.props.onRemove(restPayload);
            }}
          >
            Remove
          </Button>
        </td>
      </tr>
    );
  }
}

EdgeRow.propTypes = {
  edge: PropTypes.object.isRequired,
  onRemove: PropTypes.func,
  onChange: PropTypes.func,
};

export default EdgeRow;
