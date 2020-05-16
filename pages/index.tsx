import React, {useState} from "react";
import StageViewer from "../components/StageViewer";
import useStage from "../lib/digitalstage/useStage";
import {Button} from "baseui/button";
import {FormControl} from "baseui/form-control";
import {Input} from "baseui/input";
import Container from "../components/ui/Container";
import {styled} from "baseui";

const Image = styled("img", {
    display: 'block',
    width: 'auto',
    height: '100px',
    objectFit: 'cover'
});

const Image2 = styled("img", {
    display: 'block',
    width: '100px',
    height: 'auto',
    objectFit: 'contain'
});

export default () => {
    const {join, stage} = useStage();
    const [stageId, setStageId] = useState<string>("");

    if (stage) {
        <StageViewer stage={stage}/>
    }

    return (
        <Container>
            <h1><Image2
                src="https://bilder.t-online.de/b/86/98/98/64/id_86989864/c_Master-1-1-Large/tid_da/jan-boehmermann-der-zdf-moderator-wechselt-2020-ins-zdf-hauptprogramm-seinem-sender-widmete-er-die-letzte-neo-magazin-royale-ausgabe-.jpg"/>
                Late night stage ;-)</h1>
            <Image
                src="https://bilder.t-online.de/b/86/98/98/64/id_86989864/c_Master-1-1-Large/tid_da/jan-boehmermann-der-zdf-moderator-wechselt-2020-ins-zdf-hauptprogramm-seinem-sender-widmete-er-die-letzte-neo-magazin-royale-ausgabe-.jpg"/>

            <FormControl label="Stage ID">
                <Input value={stageId} onChange={(e) => setStageId(e.currentTarget.value)}/>
            </FormControl>
            <Button disabled={stageId.length === 0} onClick={() => join('APDCnkEtjiNYAkEkQoEG')}>Join</Button>
        </Container>
    )
}