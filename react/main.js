import React from 'react'
import ReactDOM from 'react-dom';
import StatBlock from 'StatBlock';

// Needed for getting the stylesheets loaded for bootstrap.
import 'bootstrap/scss/bootstrap.scss';
import 'react-widgets/lib/scss/react-widgets.scss';

/* Django template entrypoint. Pass sheetId as integer and DOM element to
   mount the sheet to.
*/
export function render(sheetId, target) {
    ReactDOM.render(<StatBlock url={`/rest/sheets/${sheetId}/`}/>, target);
}
