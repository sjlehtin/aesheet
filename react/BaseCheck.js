import StatBreakdown from "./StatBreakdown";
import React from "react";

export function BaseCheck({baseCheck}) {
    const baseCheckStyle = {
        display: 'inline-block',
        fontSize: "80%",
        marginLeft: "2em",
        color: "gray"
    }
    return <div><label id={"base-check"} style={baseCheckStyle}>Base check</label>
        <span aria-labelledby={"base-check"}>
            <StatBreakdown value={baseCheck} style={baseCheckStyle} toFixed={0} />
        </span>
    </div>
}