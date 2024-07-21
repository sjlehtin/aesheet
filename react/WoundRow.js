import React from "react";
import PropTypes from "prop-types";

import { Button, FormControl } from "react-bootstrap";
import { DecreaseButton, IncreaseButton } from "ModificationButton";

class WoundRow extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      editingEffect: false,
      effect: this.props.wound.effect,
    };
  }

  handleWorsen() {
    if (this.props.onMod) {
      this.props.onMod({
        id: this.props.wound.id,
        damage: this.props.wound.damage + 1,
      });
    }
  }

  handleHeal() {
    if (this.props.onMod) {
      this.props.onMod({
        id: this.props.wound.id,
        healed: this.props.wound.healed + 1,
      });
    }
  }

  handleRemove() {
    if (this.props.onRemove) {
      this.props.onRemove({ id: this.props.wound.id });
    }
  }

  handleEffectFieldClicked() {
    this.setState({ editingEffect: !this.state.editingEffect });
  }

  handleEffectChanged(e) {
    this.setState({ effect: e.target.value });
  }

  cancelEdit(e) {
    this.setState({
      effect: this.props.wound.effect,
      editingEffect: false,
    });
  }

  handleKeyDown(e) {
    if (e.code === "Enter") {
      /* Enter. */
      this.props
        .onMod({
          id: this.props.wound.id,
          effect: this.state.effect,
        })
        .then(() => this.setState({ editingEffect: false }));
    } else if (e.code === "Escape") {
      /* Escape. */
      this.cancelEdit();
    }
  }

  render() {
    const worsenButton = (
      <IncreaseButton
        style={{ color: "red" }}
        onClick={() => this.handleWorsen()}
        name={"Increase damage"}
      />
    );
    let decreaseButton = "";

    if (this.props.wound.healed < this.props.wound.damage) {
      decreaseButton = (
        <DecreaseButton
          style={{ color: "green" }}
          onClick={() => this.handleHeal()}
          name={"Decrease damage"}
        />
      );
    }

    var effectField = this.props.wound.effect;
    if (this.state.editingEffect) {
      effectField = (
        <FormControl
          type="text"
          aria-label={"Wound effect"}
          onChange={(value) => this.handleEffectChanged(value)}
          onKeyDown={(e) => this.handleKeyDown(e)}
          onClick={(c) => c.stopPropagation()}
          value={this.state.effect}
        />
      );
    }
    return (
      <tr style={this.props.style}>
        <td>{this.props.wound.location}</td>
        <td>{this.props.wound.damage_type}</td>
        <td aria-label={"Current wound damage"}>
          {this.props.wound.damage - this.props.wound.healed}
          <span style={{ position: "relative" }}>
            {worsenButton}
            {decreaseButton}
          </span>
        </td>
        <td
          aria-label={"Wound effect"}
          onClick={() => this.handleEffectFieldClicked()}
        >
          {effectField}
        </td>
        <td style={{ width: "3em" }}>
          <Button size="sm" onClick={() => this.handleRemove()}>
            Heal
          </Button>
        </td>
      </tr>
    );
  }
}

WoundRow.propTypes = {
  wound: PropTypes.object.isRequired,
  onMod: PropTypes.func,
  onRemove: PropTypes.func,
};

export default WoundRow;
