import React from "react";

export function Unskilled({missingSkills}) {
    return missingSkills.length > 0 ?
        <div style={{color:"red"}} title={`Missing skills: ${missingSkills.join(' ,')}`}>
                Unskilled
        </div> : ''
}
