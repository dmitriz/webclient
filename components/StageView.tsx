import {useStage} from "../lib/digitalstage/useStage2"

export default () => {
    const {members} = useStage();

    return (
        <div>
            {members.length}
        </div>
    )
}
