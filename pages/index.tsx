import React from "react";
import StageViewer from "../components/StageViewer";
import useStage from "../lib/digitalstage/useStage";
import {Button} from "baseui/button";

export default () => {
    const {create, join, stage} = useStage();

    if (stage) {
        <StageViewer stage={stage}/>
    }

    return (
        <div>
            <Button onClick={() => join('mystageid')}>Join</Button>
        </div>
    )
}