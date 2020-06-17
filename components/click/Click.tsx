import React, {useCallback, useEffect, useState} from "react";
import useTimesync from "../../lib/useTimesync";
import "firebase/database";
import useClick from "../../lib/useClick";
import {useDigitalStage} from "../../lib/digitalstage/useDigitalStage";
import {OverlayButton} from "../theme/OverlayButton";
import {Debugger} from "../../lib/digitalstage/base";


export default () => {
    const {api} = useDigitalStage();

    // Audio specific
    const [startTime, setStartTime] = useState<number>(0);
    const {enabled, enableClick, playing, setPlaying} = useClick({
        bpm: 120,
        startTime: startTime,
        offset: 0,
        timeSignature: {
            beats: 4,
            measure: 4
        }
    });


    // Timesync specific
    const {timesync} = useTimesync();

    const handleUpdate = useCallback((data) => {
        if (data) {
            if (data.playing) {
                setStartTime(data.startTime);
                setPlaying(true);
            } else {
                setPlaying(false);
            }
        }
    }, []);

    // Now we prepare the playback handling of the click
    useEffect(() => {
        if (api) {
            api.on("click", handleUpdate);
            return  () => {
                Debugger.debug("Cleaning up and stopping buffer", "Click");
                if( api )
                    api.off("click", handleUpdate);
            }
        }
    }, [api]);

    const toggleClick = useCallback(() => {
        if( api ) {
            if( playing ) {
                setPlaying(false);
                return api.stopClick();
            } else {
                if( timesync ) {
                    const startTime = (new Date(timesync.now())).getTime() + 1000;
                    return api.startClick(startTime);
                }
                console.error("Timesync not ready");
            }
        }
    }, [timesync, playing, api]);

    return (
        <OverlayButton $active={enabled} onClick={enabled ? toggleClick : enableClick}>
            <img src={playing ? "music_note-24px.svg" : "music_off-24px.svg"}/>
        </OverlayButton>
    );
};
