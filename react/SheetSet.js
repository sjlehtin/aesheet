import React from "react";
import {Col,Row, Container, Button} from 'react-bootstrap'
import {GoChevronLeft, GoChevronRight} from 'react-icons/go'
import CompactSheet from "./CompactSheet";
import {AddSheetControl} from "./AddSheetControl";
import useSwr from 'swr'
import Loading from "./Loading";
import * as rest from './sheet-rest'
import RangeControl from "./RangeControl";
import GravityControl from "./GravityControl";
import {useState} from 'react';


async function handleAdd(sheetSetId, sheetId, sheetSetSheets, sheetsMutate){
    const json = await rest.post(`/rest/sheetsets/${sheetSetId}/sheetsetsheets/`, {order: sheetSetSheets.length,
        sheet: sheetId
    })
    console.log("pushed to set")
    let newSheetSetSheet = json
    if (typeof(json.sheet) === "number") {
        newSheetSetSheet.sheet = {id: json.sheet}
    }
    let newSheets = sheetSetSheets.slice()
    newSheets.push(newSheetSetSheet)
    await sheetsMutate(newSheets)
}


async function handleClone(sheetSetId, sheetSetSheet,  sheetSetSheets, sheetsMutate) {
    console.log("original", sheetSetSheet)
    const newSheet = await rest.post(`/rest/sheets/${sheetSetSheet.sheet.id}/clone/`, {})
    console.log("clone", newSheet)
    const json = await rest.post(`/rest/sheetsets/${sheetSetId}/sheetsetsheets/`, {order: sheetSetSheets.length,
        sheet: newSheet.id
    })
    console.log("pushed to set")
    let newSheetSetSheet = json
    if (typeof(json.sheet) === "number") {
        newSheetSetSheet.sheet = {id: json.sheet}
    }
    let newSheets = sheetSetSheets.slice()
    newSheets.push(newSheetSetSheet)
    await sheetsMutate(newSheets)

    return newSheetSetSheet
}


async function updateOrdering(sheetSetId, sheetSetSheets) {
    for (let index = 0; index < sheetSetSheets.length; index++) {
        const sheetSetSheet = sheetSetSheets[index]

        if (sheetSetSheet.order !== index) {
            console.log("updating", sheetSetSheet, "new index", index)
            const resp = await rest.patch(`/rest/sheetsets/${sheetSetId}/sheetsetsheets/${sheetSetSheet.id}/`,
                {order: index}
            )
            console.log(resp)
        }
    }
}


export function SheetSet({sheetSetId}) {
    const [range, setRange] = useState('')
    const [detectionLevel, setDetectionLevel] = useState(0)
    const [gravity, setGravity] = useState(1.0)

    const { data: sheetSet, error: errorSheetSet, isLoading: sheetSetLoading } =
        useSwr(`/rest/sheetsets/${sheetSetId}/`, rest.getData)

    const { data: sheetSetSheets, error: errorSheets, isLoading: sheetsLoading, mutate: sheetsMutate } =
        useSwr(`/rest/sheetsets/${sheetSetId}/sheetsetsheets/`, rest.getData)

    if (errorSheetSet || errorSheets) return <div>Error loading sheetset.</div>
    if (sheetSetLoading || sheetsLoading) return <Loading>SheetSet</Loading>

    const rows = sheetSetSheets.map(
        (sheetSetSheet, index) => {
            const url = `/rest/sheets/${sheetSetSheet.sheet.id}/`;
            return <Col className="col-sm-4 mb-3" key={url}>
                <CompactSheet key={url} url={url} toRange={range}
                              darknessDetectionLevel={detectionLevel}
                              gravity={gravity}>
                    <div>
                        <Button aria-label={"Move sheet left"}
                                disabled={!index} size={"sm"}
                                onClick={async () => {
                                    let newList = sheetSetSheets.slice()
                                    newList.splice(index - 1, 2, newList[index], newList[index - 1])
                                    await updateOrdering(sheetSetId, newList)
                                    return sheetsMutate(newList)
                                }
                                }><GoChevronLeft/></Button>{' '}
                        <Button aria-label={"Move sheet right"}
                                disabled={index === sheetSetSheets.length - 1}
                                size={"sm"} onClick={async () => {
                            let newList = sheetSetSheets.slice()
                            newList.splice(index, 2, newList[index + 1], newList[index])
                            await updateOrdering(sheetSetId, newList)
                            return sheetsMutate(newList)
                        }
                        }><GoChevronRight/></Button>{' '}
                        <Button size="sm" onClick={async () => {
                            await rest.del(`/rest/sheetsets/${sheetSetId}/sheetsetsheets/${sheetSetSheet.id}/`)
                            let newList = sheetSetSheets.slice()
                            newList.splice(index, 1)
                            return sheetsMutate(newList)
                        }
                        }>Remove from set</Button>
                        {' '}
                        <div className="vr"/>
                        {' '}
                        <Button size="sm" onClick={() => {
                            return handleClone(sheetSetId, sheetSetSheet, sheetSetSheets, sheetsMutate)
                        }}>Clone</Button>
                        {' '}
                        <Button size="sm" variant="danger"
                                onClick={async () => {
                                    await rest.del(`/rest/sheets/${sheetSetSheet.sheet.id}`)
                                    let newList = sheetSetSheets.slice()
                                    newList.splice(index, 1)
                                    return sheetsMutate(newList)
                                }
                                }>Delete sheet</Button>
                    </div>
                </CompactSheet>
            </Col>
        })

    return <Container className={"m-1"} fluid={"true"}>
        <Row className={"m-1"}>
            <Col fluid={"true"} xs={3}>
            Add sheets
                <AddSheetControl campaign={sheetSet.campaign}
                                 sheets={sheetSetSheets.map((obj) => obj.sheet.id)}
                                 addSheet={async (sheetId) => {
                                     await handleAdd(sheetSetId, sheetId, sheetSetSheets, sheetsMutate)
                                 }}/>
            </Col>
            <Col><RangeControl onChange={(newRange) => {
                    setRange(newRange.range),
                    setDetectionLevel(newRange.darknessDetectionLevel)
        }}
                                  initialRange={range}
                                  initialDetectionLevel={detectionLevel}
                    />
            </Col>
            <Col>
                <GravityControl initialValue={gravity} onChange={setGravity} />
            </Col>
        </Row>
        <Row fluid={"true"}>
            {rows}
        </Row>
    </Container>
}