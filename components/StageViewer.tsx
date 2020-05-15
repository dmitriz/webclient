import useStage from "../lib/digitalstage/useStage";
import React, {useEffect, useState} from "react";
import {Button} from "baseui/button";
import {Member} from "../lib/digitalstage/clientModels";


export default () => {
    const {create, join, stage} = useStage();
    const [name, setName] = useState<string>();
    const [members, setMembers] = useState<Member[]>([]);

    useEffect(() => {
        if (stage) {
            stage.members.subscribe((members: Member[]) => setMembers(members));
            stage.name.subscribe((name: string) => setName(name));
        }
    }, [stage])

    if (stage) {
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
        )
    }

    return (
        <div>
            <Button onClick={() => create()}>Create</Button>
            <Button onClick={() => join()}>Join</Button>

        </div>

    )
}