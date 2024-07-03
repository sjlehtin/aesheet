import React from 'react'
import StatBlock from 'StatBlock';
import CompactSheet from "./CompactSheet";
import { createRoot } from 'react-dom/client';

// Needed for getting the stylesheets loaded for bootstrap.
import 'bootstrap/scss/bootstrap.scss';
import "react-widgets/scss/styles.scss";
import {SheetSet} from "./SheetSet";

/* Django template entrypoint. Pass sheetId as integer and DOM element to
   mount the sheet to.
*/
export function renderSheet(sheetId, target) {
    const root = createRoot(target)
    root.render(<StatBlock url={`/rest/sheets/${sheetId}/`}/>);
}

export function renderCompactSheet(sheetId, target) {
    const root = createRoot(target)
    root.render(<CompactSheet url={`/rest/sheets/${sheetId}/`}/>);
}

export function renderSheetSet(sheetSetId, target) {
    const root = createRoot(target)
    root.render(<SheetSet sheetSetId={sheetSetId} />);
}
