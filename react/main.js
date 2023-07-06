import React from 'react'
import StatBlock from 'StatBlock';
import { createRoot } from 'react-dom/client';

// Needed for getting the stylesheets loaded for bootstrap.
import 'bootstrap/scss/bootstrap.scss';
import "react-widgets/scss/styles.scss";

/* Django template entrypoint. Pass sheetId as integer and DOM element to
   mount the sheet to.
*/
export function render(sheetId, target) {
    const root = createRoot(target)
    root.render(<StatBlock url={`/rest/sheets/${sheetId}/`}/>);
}
