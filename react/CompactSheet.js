import React from 'react';
import PropTypes from 'prop-types';

import {Button, Container, Modal} from 'react-bootstrap';
import StatRow from './StatRow';
import StatBreakdown from "./StatBreakdown";
import NoteBlock from './NoteBlock';
import InitiativeBlock from './InitiativeBlock';
import Loading from './Loading';
import FirearmControl from './FirearmControl';
import WeaponRow from './WeaponRow';
import RangedWeaponRow from './RangedWeaponRow';
import SkillHandler from './SkillHandler';
import ArmorControl from './ArmorControl';
import {staminaRecovery, manaRecovery} from "./StatBlock";
import StatBlock from "./StatBlock";

import {
    Card,
    Col,
    Row,
} from 'react-bootstrap';
import WoundPenaltyBox from "./WoundPenaltyBox";
import {GoHeart} from "react-icons/go";

const rest = require('./sheet-rest');
const util = require('./sheet-util');

class CompactSheet extends StatBlock {
    constructor(props) {
        super(props);
        this.state = {
            loading: true,
            sheet: undefined,
            char: undefined,
            edgeList: [],

            characterEdges: [],
            characterSkills: [],
            allSkills: [],

            firearmList: [],
            weaponList: [],
            rangedWeaponList: [],
            transientEffectList: [],
            miscellaneousItemList: [],

            gravity: 1.0,

            carriedInventoryWeight: 0,

            armor: undefined,
            helm: undefined,

            showDamages: false,

            woundList: [],

            // Apply range on firearms.
            firearmRange: ""
        };
    }

    renderDescription() {
        if (!this.state.char || !this.state.sheet) {
            return <Loading/>;
        }

        return <div>
            {this.state.char.race} {this.state.char.occupation}
            <p title="Character description">
                { this.state.char.description }
            </p>
            <p title="Sheet description">
                { this.state.sheet.description }
            </p>
        </div>;
    }

    renderNotes() {
        return <div>
                    <NoteBlock edges={this.state.edgeList}
                        effects={this.getAllEffects()} compact={true}/>
                </div>;
    }

    renderStats(skillHandler) {
        if (!skillHandler) {
            return <Loading>Stats</Loading>;
        }

        var baseStyle = {
            textAlign: "right",
            paddingLeft: 5,
            minWidth: "2em"
        };
        var effStyle = { fontWeight: "bold" };
        effStyle = Object.assign(effStyle, baseStyle);
        var statStyle = { fontWeight: "bold" };

        var rows, derivedRows, expendable;

        var baseStats = skillHandler.getBaseStats();
        var effStats = skillHandler.getEffStats();

        var stats = ["fit", "ref", "lrn", "int", "psy", "wil", "cha",
            "pos"];
        rows = stats.map((st, ii) => {
            return <StatRow stat={st}
                            key={ii}
                            initialChar={this.state.char}
                            baseStats={baseStats}
                            effStats={effStats}
                            url={this.state.url} />;
        });

        derivedRows = <tbody>
            <tr>
                <td style={statStyle}>MOV</td>
                <td style={baseStyle}>{baseStats.mov}</td>
                <td style={effStyle}><StatBreakdown label={"Stat"} value={effStats.mov.value()} breakdown={effStats.mov.breakdown()} /></td>
            </tr>
            <tr>
                <td style={statStyle}>DEX</td>
                <td style={baseStyle}>{baseStats.dex}</td>
                <td style={effStyle}><StatBreakdown label={"Stat"} value={effStats.dex.value()} breakdown={effStats.dex.breakdown()} /></td>
            </tr>
            <tr>
                <td style={statStyle}>IMM</td>
                <td style={baseStyle}>{baseStats.imm}</td>
                <td style={effStyle}><StatBreakdown label={"Stat"} value={effStats.imm.value()} breakdown={effStats.imm.breakdown()} /></td>
            </tr>
        </tbody>;

        const bodyFromToughness = skillHandler.getEdgeModifier("toughness") * 2;
        let toughness;
        if (bodyFromToughness) {
            toughness = <span>+<span style={{ fontWeight: "bold"}}
                                     id={"bodyFromToughness"}
                                     aria-label={"Body from Toughness"}
            >{bodyFromToughness}</span></span>;
        } else {
            toughness = "";
        }
        var recoveryStyle = {
            color: "grey",
            paddingLeft: 5
        };

        expendable = <tbody>
        <tr><td style={statStyle}>B</td>
            <td style={baseStyle} aria-label={"Body at full health"}>{baseStats.baseBody}{toughness}</td>
            <td aria-label={"Body healing"} style={recoveryStyle}>{this.bodyHealing(skillHandler)}</td>
            <td>{skillHandler.getCurrentBody()}</td>
        </tr>
        <tr>
            <td style={statStyle}>S</td>
            <td style={baseStyle}>{baseStats.stamina}</td>
            <td aria-label={"Stamina recovery"}
                style={recoveryStyle}>{staminaRecovery(effStats, skillHandler)
            }</td>
            <td>{skillHandler.getCurrentStamina()}</td>
        </tr>

        <tr>
            <td style={statStyle}>M</td>
            <td style={baseStyle}
                aria-label={"Maximum mana"}>{baseStats.mana}</td>
            <td aria-label={"Mana recovery"}
                style={recoveryStyle}>{manaRecovery(effStats, skillHandler)
            }</td>
            <td>{skillHandler.getCurrentMana()}</td>

        </tr>
        </tbody>;

        return <div style={{position: "relative", width: "18em"}}>
            <table>
                <tbody>
                {rows}
                </tbody>
                {derivedRows}
                {expendable}
            </table>
        </div>;
    }

    renderAdvancingInitiatives (skillHandler) {
        if (!skillHandler) {
            return <Loading>Advancing initiatives</Loading>;
        }
        return <div style={{fontSize: "70%"}}>
            <strong className={"mt-1"}>Advancing in combat</strong>

            <InitiativeBlock className="m-1"
                             distance={this.props.toRange}
                             stats={skillHandler}/>;
        </div>
    }

    getSkillHandler() {
        if (!this.state.char || !this.state.edgeList || !this.state.armor ||
            !this.state.helm) {
            return null;
        }
        return new SkillHandler({
            character: this.state.char,
            characterSkills: this.state.characterSkills,
            allSkills: this.state.allSkills,
            edges: this.state.edgeList,
            effects: this.getAllEffects(),
            weightCarried: this.getCarriedWeight(),
            staminaDamage: this.state.sheet.stamina_damage,
            gravity: this.props.gravity,
            wounds: this.state.woundList,
            armor: this.state.armor,
            helm: this.state.helm
        });
    }


    renderFirearms(skillHandler) {
        if (this.state.loading) {
            return <Loading>Firearms</Loading>;
        }
        var rows = [];

        var idx = 0;
        const baseStyle = {fontSize: "80%"}
        for (let fa of this.state.firearmList) {
            let bgColor
            if (idx % 2 === 0) {
                bgColor = "transparent"
            } else {
                bgColor = "rgb(245, 245, 255, 0.4)"
            }
            rows.push(<FirearmControl
                key={idx++} weapon={fa}
                skillHandler={skillHandler}
                onRemove={(fa) => this.handleFirearmRemoved(fa) }
                onChange={async (data) => await this.handleFirearmChanged(data)}
                onMagazineRemove={async (mag) => await this.handleMagazineRemoved(fa, mag)}
                onMagazineAdd={async (mag) => await this.handleMagazineAdded(fa, mag)}
                onMagazineChange={async (mag) => await this.handleMagazineChanged(fa, mag)}
                campaign={this.state.char.campaign}
                style={Object.assign({}, baseStyle, {backgroundColor: bgColor})}
                toRange={this.props.toRange}
                darknessDetectionLevel={this.props.darknessDetectionLevel}
            />);
        }

        return <div>
            {rows}
            </div>
    }

    renderCCWeapons(skillHandler) {
        if (!this.state.weaponList || !skillHandler) {
            return <Loading>Close-combat weapons</Loading>;
        }

        var rows = [];

        var idx = 0;

        for (let wpn of this.state.weaponList) {
            if (idx % 2 === 0) {
                var bgColor = "transparent";
            } else {
                bgColor = "rgb(245, 245, 255)";
            }

            rows.push(<WeaponRow
                key={idx++} weapon={wpn}
                skillHandler={skillHandler}
                onRemove={(wpn) => this.handleWeaponRemoved(wpn) }
                style={{fontSize: "80%", backgroundColor: bgColor}}
            />);
        }

        return <div>
            {rows}
            </div>
    }

    renderRangedWeapons(skillHandler) {
        if (!this.state.rangedWeaponList || !skillHandler) {
            return <Loading>Ranged weapons</Loading>;
        }

        var rows = [];

        var idx = 0;

        for (let wpn of this.state.rangedWeaponList) {
            if (idx % 2 === 0) {
                var bgColor = "transparent";
            } else {
                bgColor = "rgb(245, 245, 255)";
            }

            rows.push(<RangedWeaponRow
                key={idx++} weapon={wpn}
                skillHandler={skillHandler}
                onRemove={(wpn) => this.handleRangedWeaponRemoved(wpn) }
                style={{fontSize: "80%", backgroundColor: bgColor}}
                gravity={this.props.gravity}
            />);
        }

        return <div>
            {rows}
        </div>

    }

    renderArmor(skillHandler) {
        if (this.state.loading) {
            return <Loading>Armor</Loading>;
        }
        return <ArmorControl
                campaign={this.state.char.campaign}
                armor={this.state.armor}
                helm={this.state.helm}
                handler={skillHandler}
                miscellaneousItems={this.state.miscellaneousItemList}
                style={{fontSize: "80%"}}
                />
    }

    render() {
        const skillHandler = this.getSkillHandler();

        const statusMap = new Map([
            [SkillHandler.STATUS_OK, "bg-success-subtle"],
            [SkillHandler.STATUS_WOUNDED, "bg-warning-subtle"],
            [SkillHandler.STATUS_CRITICAL, "bg-danger-subtle"]
        ])

        const statusClass = skillHandler ? `${statusMap.get(skillHandler.getStatus())}` : "";

        const title = this.state.char ? `${this.state.char.name} ${this.state.char.total_xp} XP` : ''

        return (
            <div style={{fontSize: "smaller"}}>
                <Modal size="lg" show={this.state.showDamages} onHide={() => {
                    this.setState(
                        {showDamages: false}
                    )
                }}>
                    <Modal.Header closeButton>
                        <Modal.Title>{title} damages</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>{this.renderDamages(skillHandler)}</Modal.Body>
                    <Modal.Footer>
                        <Button variant="primary" onClick={() => {
                            this.setState(
                                {showDamages: false}
                            )
                        }}>
                            Close
                        </Button>
                    </Modal.Footer>
                </Modal>
            <Card className={`m-0 ${statusClass}`}>
                <Card.Header>
                    <Row fluid={"true"}>
                        <Col xs={4} className={"pl-1"}>
                    <strong style={{fontSize: "larger"}}>{title ? <a href={`/sheets/${this.state.sheet.id}/`}>{title}</a> : <Loading>Character</Loading>}{' '}{this.state.sheet?.description} {`(id: ${this.state.sheet?.id})`}</strong>
                        </Col>
                        <Col xs={2} className={"p-0"}>
                            <Button size={"sm"} onClick={() => {this.setState(
                          {showDamages: true}
                      )}} title="Show and assign damage"><GoHeart/><span style={{fontSize: "xx-small"}}>{' '}Dmg</span></Button></Col>
                        <Col fluid={"true"} className="d-flex justify-content-end">
                            {this.props.children}
                        </Col>
                    </Row>
                </Card.Header>
            <Card.Body className={"p-0"}>
                <Container>
                    <Row>
                        <Col className="xs-12">
                            <Row>
                                {this.renderDescription()}
                            </Row>
                            <Row>
                                <Col xs={3}>
                                    {this.renderStats(skillHandler)}
                                </Col>
                                <Col xs={2} style={{fontSize: "70%"}}>
                                    {skillHandler ?
                                        <WoundPenaltyBox
                                            handler={skillHandler}/> :
                                        <Loading>Wounds</Loading>
                                    }
                                </Col>
                                <Col xs={7}>
                                    <Row>
                                        <Col>
                                            {this.renderArmor(skillHandler)}
                                        </Col>
                                    </Row>
                                    <Row>
                                        <Col>
                                            {this.renderAdvancingInitiatives(skillHandler)}
                                        </Col>
                                    </Row>
                                </Col>

                            </Row>
                        </Col>
                    </Row>
                    <Row>
                        <Col>
                            <Row>
                                <Col>{this.renderWeightCarried()}</Col>
                            </Row>
                            <Row>
                                <Col>
                                {this.renderNotes()}
                                </Col>
                            </Row>
                        </Col>
                    </Row>
                    <Row>
                        <Col>
                        {this.renderCCWeapons(skillHandler)}
                        </Col>
                    </Row>
                    <Row>
                        <Col>
                        {this.renderFirearms(skillHandler)}
                        </Col>
                    </Row>
                    <Row>
                        <Col>
                        {this.renderRangedWeapons(skillHandler)}
                        </Col>
                    </Row>
                </Container>
            </Card.Body>
            </Card>
            </div>
        )
    }
}

CompactSheet.propTypes = {
    url: PropTypes.string.isRequired,
    style: PropTypes.object,
    toRange: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
    darknessDetectionLevel: PropTypes.number.isRequired,
    gravity: PropTypes.number.isRequired,
    onCharacterSkillAdd: PropTypes.func,
    onCharacterSkillRemove: PropTypes.func,
    onCharacterSkillModify: PropTypes.func
};

export default CompactSheet;
