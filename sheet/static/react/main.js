import React from 'react'

// import only the render function of react-dom using ES2015 destructuring
import { render } from 'react-dom'

import Character from "Character.jsx"

render(
  <Character />,
  document.getElementById('character-container')
);