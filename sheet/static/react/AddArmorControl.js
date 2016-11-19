import React from 'react';
import ReactDOM from 'react-dom';
import { Button, Input, Row } from 'react-bootstrap';
import Combobox from 'react-widgets/lib/Combobox';

var rest = require('sheet-rest');

class AddArmorControl extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            selectedQuality: null,
            selectedArmor: null,
            qualityChoices: [],
            armorChoices: [],
            armorTemplateChoices: []
        }
    }

    componentDidMount() {
        rest.getData(`/rest/armorqualities/campaign/${this.props.campaign}/`).then(
            (json) => {
                this.setState({
                    qualityChoices: json})
            }
        ).catch((err) => console.log(err));
        rest.getData(`/rest/armors/campaign/${this.props.campaign}/`).then(
            (json) => {
                this.setState({
                    armorChoices: json})
            }
        ).catch((err) => console.log(err));
        rest.getData(`/rest/armortemplates/campaign/${this.props.campaign}/`).then(
            (json) => {
                this.setState({
                    armorTemplateChoices: json})
            }
        ).catch((err) => console.log(err));
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

            this.setState({selectedQuality: null, selectedArmor: null});
        }
    }

    render() {
        var quality;
        var busy = (!this.state.armorChoices || !this.state.armorTemplateChoices ||
            !this.state.qualityChoices);
        if (this.state.selectedArmor && this.state.selectedArmor.quality) {
            quality = <span>{this.state.selectedArmor.quality.name}</span>;
        } else {
            quality = <Combobox
                data={this.state.qualityChoices}
                value={this.state.selectedQuality}
                textField='name'
                filter="contains"
                busy={busy}
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
                    <td><label>{this.props.tag}</label></td>
                    <td><Combobox data={choices}
                                  textField='name'
                                  busy={busy}
                                  filter="contains"
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
            <Button bsSize="small" disabled={!this.fieldsValid()}
                    ref={(c) => this._addButton = c}
                    onClick={() => this.handleAdd()}>
                Set</Button>

            </Row>
        </div>
    }
}

AddArmorControl.propTypes = {
    tag: React.PropTypes.string,
    onChange: React.PropTypes.func
};

AddArmorControl.defaultProps = {tag: "Armor"}


export default AddArmorControl;
