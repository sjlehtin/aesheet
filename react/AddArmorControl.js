import React from 'react';
import PropTypes from 'prop-types';

import { Button, Row, Form } from 'react-bootstrap';
import Combobox from 'react-widgets/Combobox';

const rest = require('./sheet-rest');

class AddArmorControl extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            normalQuality: null,
            selectedQuality: null,
            selectedArmor: null,
            qualityChoices: [],
            isBusy: true,
            armorChoices: [],
            armorTemplateChoices: []
        }
    }

    async componentDidMount() {
        let promises = [];
        promises.push(rest.getData(`/rest/armorqualities/campaign/${this.props.campaign}/`))
        promises.push(rest.getData(`/rest/armors/campaign/${this.props.campaign}/`))
        promises.push(rest.getData(`/rest/armortemplates/campaign/${this.props.campaign}/`))
        let [qualities, armors, templates] = await Promise.all(promises);

        const normalQuality = qualities.find((q) => {return /normal/i.exec(q.name);});

        this.setState({
            normalQuality: normalQuality,
            selectedQuality: normalQuality,
            qualityChoices: qualities,
            armorChoices: armors,
            armorTemplateChoices: templates,
            isBusy: false
        })
    }


    fieldsValid() {
        if (!this.state.selectedArmor) {
            return false;
        }
        if (typeof(this.state.selectedArmor) !== "object") {
            return false;
        }
        if (this.state.selectedArmor.base) {
            return true;
        }
        if (typeof(this.state.selectedQuality) === "object") {
            return true;
        } else {
            return false;
        }
    }

    handleArmorChange(value) {
        this.setState({selectedArmor: value});
    }

    handleQualityChange(value) {
        this.setState({selectedQuality: value});
    }

    handleAdd() {
         if (this.props.onChange) {
            var armor;
            if ('id' in this.state.selectedArmor) {
                armor = this.state.selectedArmor;
            } else {
                armor = {
                    base: this.state.selectedArmor,
                    quality: this.state.selectedQuality,
                    special_qualities: []
                }
            }
            this.props.onChange(armor);

            this.setState({selectedQuality: this.state.normalQuality, selectedArmor: null});
        }
    }

    render() {
        var quality;
        if (this.state.selectedArmor && this.state.selectedArmor.quality) {
            quality = <span>{this.state.selectedArmor.quality.name}</span>;
        } else {
            quality = <Combobox
                data={this.state.qualityChoices}
                value={this.state.selectedQuality}
                textField='name'
                filter="contains"
                busy={this.state.isBusy}
                aria-label={"Select quality"}
                onChange={(value) => this.handleQualityChange(value)}/>;
        }

        var choices = [];
        if (this.state.armorTemplateChoices && this.state.armorChoices) {
            var helm = (this.props.tag !== "Armor");
            choices = this.state.armorTemplateChoices.filter((value) => {
                return value.is_helm === helm;
            });
            choices = choices.concat(this.state.armorChoices.filter((value) => {
                return value.base.is_helm === helm;
            }));
        }

        return <div>
            <Row>
            <table>
                <tbody>
                <tr>
                    <td><Form.Label>{this.props.tag}</Form.Label></td>
                    <td><Combobox data={choices}
                                  textField='name'
                                  busy={this.state.isBusy}
                                  filter="contains"
                                  aria-label={`Select ${this.props.tag.toLowerCase()}`}
                                  value={this.state.selectedArmor}
                                  groupBy={(obj) => 'base' in obj ? "Existing" : "Template"}
                                  onChange={(value) => this.handleArmorChange(value) }
                /></td>
                </tr>
                <tr>
                    <td><label>Quality</label></td>
                    <td>
                        {quality}
                    </td>
                </tr>
                </tbody>
            </table>
            <Button size="sm" disabled={!this.fieldsValid()}
                    onClick={() => this.handleAdd()}>
                Set {`${this.props.tag}`}</Button>

            </Row>
        </div>
    }
}

AddArmorControl.propTypes = {
    tag: PropTypes.string,
    onChange: PropTypes.func
};

AddArmorControl.defaultProps = {tag: "Armor"}

export default AddArmorControl;
