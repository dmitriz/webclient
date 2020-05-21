import {useStage} from "../lib/digitalstage/useStage"
import {StageMember} from "../lib/digitalstage/model";

export default () => {
    const {members} = useStage();

    return (
        <div>
            {members.length} Members
            <ul>
                {members.map((member: StageMember) => (
                    <li>{member.displayName} with {member.tracks.length} tracks</li>
                ))}
            </ul>
        </div>
    )
}
