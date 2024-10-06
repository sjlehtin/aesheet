import React from "react";
import PropTypes from "prop-types";

import { Button, Form, Row } from "react-bootstrap";
import Combobox from "react-widgets/Combobox";

import * as rest from './sheet-rest'

class AddArmorControl extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      normalQuality: null,
      selectedQuality: null,
      selectedArmor: null,
      qualityChoices: [],
      isBusy: true,
    };
  }

  async componentDidMount() {
    let promises = [];
    promises.push(
      rest.getData(`/rest/armorqualities/campaign/${this.props.campaign}/`),
    );
    promises.push(
      rest.getData(`/rest/armors/campaign/${this.props.campaign}/`),
    );
    promises.push(
      rest.getData(`/rest/armortemplates/campaign/${this.props.campaign}/`),
    );
    let [qualities, armors, templates] = await Promise.all(promises);

    const normalQuality = qualities.find((q) => {
      return /normal/i.exec(q.name);
    });

    const shouldBeHelmet = this.props.tag !== "Armor";
    const templateChoices = templates.filter((value) => {
      return value.is_helm === shouldBeHelmet;
    });
    const choices = [
      ...templateChoices,
      ...armors.filter((value) => {
        return value.base.is_helm === shouldBeHelmet;
      }),
    ];

    let currentArmorTemplate
    let currentQuality
    if (this.props.current) {
      currentQuality = qualities.find((q) => {
        return q.name === this.props.current.quality.name;
      })
      currentArmorTemplate = templateChoices.find((t) => {
        return t.name === this.props.current.base.name
      })
    } else {
      currentQuality = normalQuality
    }

    this.setState({
      normalQuality: normalQuality,
      selectedQuality: currentQuality,
      selectedArmor: currentArmorTemplate,
      qualityChoices: qualities,
      choices: choices,
      isBusy: false,
    });
  }

  fieldsValid() {
    if (!this.state.selectedArmor) {
      return false;
    }
    if (typeof this.state.selectedArmor !== "object") {
      return false;
    }
    if (this.state.selectedArmor.base) {
      return true;
    }
    if (typeof this.state.selectedQuality === "object") {
      return true;
    } else {
      return false;
    }
  }

  handleArmorChange(value) {
    this.setState({ selectedArmor: value });
  }

  handleQualityChange(value) {
    this.setState({ selectedQuality: value });
  }

  handleAdd() {
    if (this.props.onChange) {
      let armor;
      if ("id" in this.state.selectedArmor) {
        armor = this.state.selectedArmor;
      } else {
        armor = {
          base: this.state.selectedArmor,
          quality: this.state.selectedQuality,
          special_qualities: [],
        };
      }
      this.props.onChange(armor);
    }
  }

  render() {
    let quality;
    if (this.state.selectedArmor && this.state.selectedArmor.quality) {
      quality = <span>{this.state.selectedArmor.quality.name}</span>;
    } else {
      quality = (
        <Combobox
          data={this.state.qualityChoices}
          value={this.state.selectedQuality}
          textField="name"
          filter="contains"
          busy={this.state.isBusy}
          aria-label={`Select ${this.props.tag.toLowerCase()} quality`}
          onChange={(value) => this.handleQualityChange(value)}
        />
      );
    }

    return (
      <div>
        <Row>
          <table>
            <tbody>
              <tr>
                <td>
                  <Form.Label>{this.props.tag}</Form.Label>
                </td>
                <td>
                  <Combobox
                    data={this.state.choices}
                    textField="name"
                    busy={this.state.isBusy}
                    filter="contains"
                    aria-label={`Select ${this.props.tag.toLowerCase()}`}
                    value={this.state.selectedArmor}
                    groupBy={(obj) => ("base" in obj ? "Existing" : "Template")}
                    onChange={(value) => this.handleArmorChange(value)}
                  />
                </td>
              </tr>
              <tr>
                <td>
                  <label>Quality</label>
                </td>
                <td>{quality}</td>
              </tr>
            </tbody>
          </table>
          <Button
            size="sm"
            disabled={!this.fieldsValid()}
            onClick={() => this.handleAdd()}
          >
            Set {`${this.props.tag}`}
          </Button>
        </Row>
      </div>
    );
  }
}

AddArmorControl.propTypes = {
  tag: PropTypes.string,
  onChange: PropTypes.func,
};

AddArmorControl.defaultProps = { tag: "Armor" };

export default AddArmorControl;
