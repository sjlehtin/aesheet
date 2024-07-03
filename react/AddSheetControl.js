import React from "react";
import {Col,Row, Container, Form, Button} from 'react-bootstrap'
import useSwr from 'swr'
import Loading from "./Loading";
import {getData} from './sheet-rest'
import {useState} from 'react'


export function AddSheetControl({campaign, addSheet}) {
    const [selected, setSelected] = useState('')

    const { data, error, isLoading } =
        useSwr("/rest/sheets/", getData)

    if (error) return <div>Got error loading sheet list</div>
    if (isLoading) return <Loading>Sheet list</Loading>


    console.log("filter for campaign", campaign)
    console.log("got sheets", data)

    const filtered = data.filter(sheet => sheet.campaign === campaign);
    console.log("After filter", filtered)

    const rows = <Form.Select value={selected}  onChange={(e) => {
        console.log("Selected", e.target.value)
        setSelected(e.target.value)
    }}><option value={''}>Select sheet to add</option>
        {
        filtered.map((sheet, index) => {
            return <option key={index} value={sheet.id}>{`${sheet.character_name} ${sheet.character_total_xp} ${sheet.description} (id: ${sheet.id})`}</option>
        })
    }
    </Form.Select>
    return <Container>
        <Col xs={3} className={"m-1"}>
        <div><a href={"/sheets/add_sheet/"}>Create new sheet</a> <em>(Takes you out of this page)</em></div>
        {rows}
            <Button disabled={!selected} onClick={async () => { if (!!selected) await addSheet(selected)}}>Add</Button>
        </Col>
    </Container>
}
