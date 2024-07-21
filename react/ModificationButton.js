import React from "react";
import {GoArrowUp, GoArrowDown} from 'react-icons/go'

function ModificationButton({name, onClick, symbol, style}) {
    return <span style={style} role={"button"}
                 aria-label={name}
                 tabIndex={0}
                 onKeyDown={(e) => {
                     if (e.key === "Space") {
                         onClick()
                     } else if (e.key === "Enter") {
                         onClick()
                     }
                 }}
                 onClick={onClick}>{symbol}</span>;
}

function IncreaseButton({name, onClick, style = {}}) {
    return <ModificationButton name={name} onClick={onClick} symbol={<GoArrowUp />} style={Object.assign({
        color: "green",
        position: "absolute",
        left: 10,
        bottom: 1,
        cursor: "pointer"
    }, style)} />
}

function DecreaseButton({name, onClick, style= {}}) {
    return <ModificationButton name={name} onClick={onClick}
                               symbol={<GoArrowDown/>} style={Object.assign({
        color: "red",
        position: "absolute",
        left: 22,
        bottom: -3,
        cursor: "pointer"
    }, style)}/>
}

export {ModificationButton, IncreaseButton, DecreaseButton}
