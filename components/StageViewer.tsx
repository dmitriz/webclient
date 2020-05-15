import useStage from "../lib/digitalstage/useStage";
import React, {useEffect, useState} from "react";
import {Button} from "baseui/button";
import {Member, Stage} from "../lib/digitalstage/clientModels";
import Loading from "./ui/Loading";

export default (props: {
    stage: Stage
}) => {
    const [name, setName] = useState<string>();
    const [members, setMembers] = useState<Member[]>([]);

    useEffect(() => {
        if (props.stage) {
            props.stage.members.subscribe((members: Member[]) => setMembers(members));
            props.stage.name.subscribe((name: string) => setName(name));
        }
    }, [props.stage])

    if (!props.stage) {
        return <Loading><h1>Löadinn ...</h1></Loading>
    }

    return (
        <div>
            {name && (
                <h1>{name}</h1>
            )}
            {members && (
                <ul>
                    {members.map((member: Member) => (
                        <li>
                            {member.uid}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}