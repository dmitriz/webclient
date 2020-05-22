import {useStage} from "../lib/digitalstage/useStage"
import MemberView from "./MemberView";
import React from "react";

export default () => {
    const {members} = useStage();

    console.log(members);

    return (
        <div>
            {members.length} Members
            {members.map((member) => <MemberView member={member}/>)}
        </div>
    )
}
