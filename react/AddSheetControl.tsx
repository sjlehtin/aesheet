import {Col, Container, Form, Button} from 'react-bootstrap'
import useSwr from 'swr'
import Loading from "./Loading";
import {getData} from './sheet-rest'
import {useState} from 'react'
import {Sheet} from './api'

export function AddSheetControl({campaign, sheets, addSheet}: {campaign: number, sheets: [number], addSheet: (sheetId: number) => Promise<void>}) {
    const [selected, setSelected] = useState('')

    const {
      data,
      error,
      isLoading,
    }: {
      data: [Sheet];
      error: boolean|undefined;
      isLoading: boolean|undefined;
    } = useSwr("/rest/sheets/", getData);

    if (error) return <div>Got error loading sheet list</div>
    if (isLoading) return <Loading>Sheet list</Loading>

    const filtered = data.filter(sheet => sheet.campaign === campaign && !sheets.includes(sheet.id));

    const rows = <Form.Select value={selected}  onChange={(e) => {
        setSelected(e.target.value)
    }}><option value={''}>Select sheet to add</option>
        {
        filtered.map((sheet, index) => {
            return <option key={index} value={sheet.id}>{`${sheet.character_name} ${sheet.character_total_xp} ${sheet.description} (id: ${sheet.id})`}</option>
        })
    }
    </Form.Select>
    return <Container>
        <Col>
        <div><a href={"/sheets/add_sheet/"}>Create new sheet</a> <em>(Takes you out of this page)</em></div>
        {rows}
            <Button disabled={!selected} onClick={async () => { if (!!selected) await addSheet(parseInt(selected))}}>Add</Button>
        </Col>
    </Container>
}
