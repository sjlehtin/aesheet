import React from 'react'

// import only the render function of react-dom using ES2015 destructuring
import { render } from 'react-dom'

import CharacterNotes from "CharacterNotes"

/* This is what this would look like in JSX.  We cannot use this directly, or
   it would be even more awkward, as we need to get the URL for the REST API
   from the rendered sheet template (sheet_detail.html).

   Once the we perform the whole of the sheet rendering in JSX, we can get rid
   of the Django template altogether.
*/
//render(
//  <Character url="/rest/characters/1/"/>,
//  document.getElementById('character-container')
//);

/* Expose for use in Django templates. */
module.exports = {
    "React": React,
    "CharacterNotes": CharacterNotes,
    "render": render
}