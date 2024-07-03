import React from "react";
import {Col,Row, Container, Button} from 'react-bootstrap'
import CompactSheet from "./CompactSheet";
import {AddSheetControl} from "./AddSheetControl";
import useSwr from 'swr'
import Loading from "./Loading";
import * as rest from './sheet-rest'



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


export function SheetSet({sheetSetId}) {
    let rows = []

    const { data: sheetSet, error: errorSheetSet, isLoading: sheetSetLoading } =
        useSwr(`/rest/sheetsets/${sheetSetId}/`, rest.getData)

    const { data: sheetSetSheets, error: errorSheets, isLoading: sheetsLoading, mutate: sheetsMutate } =
        useSwr(`/rest/sheetsets/${sheetSetId}/sheetsetsheets/`, rest.getData)

    if (errorSheetSet || errorSheets) return <div>Error loading sheetset.</div>
    if (sheetSetLoading || sheetsLoading) return <Loading>SheetSet</Loading>

    console.log("got sheetset", sheetSet)
    console.log("got sheets for sheetsets", sheetSetSheets)

    const size = 3
    for (let ii = 0; ii < sheetSetSheets.length; ii += size) {
        rows.push(<Row key={ii}>{
            sheetSetSheets.slice(ii, ii + size).map(
                (sheetSetSheet, index) => {

                    const url = `/rest/sheets/${sheetSetSheet.sheet.id}/`;
                    console.log("Rendering sheet", sheetSetSheet, url)
                    return <Col key={index}>
                        <CompactSheet key={index} url={url}>
                            <div>
                            <Button size="sm" onClick={async () => {
                                console.log("clone pressed")
                                const clone = await handleClone(sheetSetId, sheetSetSheet, sheetSetSheets, sheetsMutate)
                            }}>Clone</Button>{' '}
                            <Button size="sm" onClick={async () => {
                                console.log("Remove pressed")
                                await rest.del(`/rest/sheetsets/${sheetSetId}/sheetsetsheets/${sheetSetSheet.id}/`)
                                console.log("sheetsetsheet deleted")
                                let newList = sheetSetSheets.slice()
                                newList.splice(index, 1)
                                await sheetsMutate(newList)
                            }
                            }>Remove from set</Button>
                            <Button size="sm" variant="danger" onClick={async () => {
                                console.log("Delete pressed")
                                await rest.del(`/rest/sheets/${sheetSetSheet.sheet.id}`)
                                console.log("sheet deleted")
                                let newList = sheetSetSheets.slice()
                                newList.splice(index, 1)
                                await sheetsMutate(newList)
                            }
                            }>Delete sheet</Button>
                        </div>
                        </CompactSheet>
                    </Col>
                })
        }</Row>)
    }
    return <Container fluid>
        <Row>
            Add sheets
            <AddSheetControl campaign={sheetSet.campaign} addSheet={async (sheetId) => {
                console.log("Add called", sheetId)
                await handleAdd(sheetSetId, sheetId, sheetSetSheets, sheetsMutate)
            }}/>
        </Row>
            {rows}
    </Container>
}