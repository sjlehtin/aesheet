import React from 'react'
import ReactDOM from 'react-dom';
//import { render } from 'react-dom'
//import CharacterNotes from "CharacterNotes"
import StatBlock from 'StatBlock';

//import CharacterNotes from "CharacterNotes"
// import StatBlock from "StatBlock"
// import Inventory from "Inventory"
// import InitiativeBlock from "InitiativeBlock"
// import SkillTable from "SkillTable"
//
import 'bootstrap/dist/css/bootstrap.css';
import 'react-widgets/lib/scss/react-widgets.scss';
// let React = require('react');
// let ReactDOM = require('react-dom');
// let CharacterNotes = require('CharacterNotes');
// let StatBlock = require('StatBlock');
// let Inventory = require('Inventory');
// let InitiativeBlock = require('InitiativeBlock');
// let SkillTable = require('SkillTable');
//
// const rest = require('./sheet-rest');

/* This is what this would look like in JSX.  We cannot use this directly, or
   it would be even more awkward, as we need to get the URL for the REST API
   from the rendered sheet template (sheet_detail.html).

   Once the we perform the whole of the sheet rendering in JSX, we can get rid
   of the Django template altogether.
*/
export function render(sheetId, target) {
    ReactDOM.render(<StatBlock url={`/rest/sheets/${sheetId}/`}/>, target);
}

//render(
//  <Character url="/rest/characters/1/"/>,
//  document.getElementById('character-container')
//);

/* Expose for use in Django templates. */
// module.exports = {
//     "rest": rest,
//     "React": React,
//     "CharacterNotes": CharacterNotes,
//     "StatBlock": StatBlock,
//     "Inventory": Inventory,
//     "InitiativeBlock": InitiativeBlock,
//     "SkillTable": SkillTable,
//     "ReactDOM": ReactDOM
// };