import StatBreakdown from "./StatBreakdown";
import ValueBreakdown from "./ValueBreakdown";

export default function SkillCheck({skillCheck} : {skillCheck: ValueBreakdown}) {
        return <StatBreakdown value={skillCheck} />
}
