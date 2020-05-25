import {useCallback, useEffect, useState} from "react";
import useTimesync from "../../lib/useTimesync";
import {Button} from "baseui/button";
import firebase from "firebase/app";
import "firebase/firestore";
import useClick from "../../lib/useClick";
import {useStage} from "../../lib/digitalstage/useStage";
import {styled} from "baseui";

const Panel = styled("div", {
    width: "100%",
    display: "flex",
})

export default () => {
    const [offsetTime, setOffsetTime] = useState<number>(0);
    const [useOffset, setUseOffset] = useState<boolean>(true);
    const {stage} = useStage();

    // Audio specific
    const [startTime, setStartTime] = useState<number>(0);
    const {enabled, enableClick, playing, setPlaying} = useClick({
        bpm: 120,
        startTime: startTime,
        offset: useOffset ? offsetTime : 0,
        timeSignature: {
            beats: 4,
            measure: 4
        }
    });


    // Timesync specific
    const {timesync, offset} = useTimesync();


    useEffect(() => {
        setOffsetTime(offset);
    }, [offset]);


    // Now we prepare the playback handling of the click
    useEffect(() => {
        if (stage) {
            // Listen to changes in firebase
            firebase.firestore().collection('stages').doc(stage.id).onSnapshot(
                (doc) => {
                    const data = doc.data();
                    if (data) {
                        if (data.playing) {
                            console.log("Start playing at " + data.startTime);
                            setStartTime(data.startTime);
                            setPlaying(true);
                        } else {
                            console.log("Stop playing");
                            setPlaying(false);
                        }
                    }
                }
            );
        }
    }, [stage]);

    const toggleClick = useCallback(() => {
        if (!stage)
            return;

        if (playing) {
            console.log("Emit to stop playing");
            firebase.firestore().collection('stages').doc(stage.id).update({
                playing: false
            }).catch(err => console.error(err));
        } else {
            if (timesync) {
                console.log("Emit to start playing");
                const startTime = (new Date(timesync.now())).getTime() + 1000;
                console.log("Playing at " + startTime);
                firebase.firestore().collection('stages').doc(stage.id).update({
                    startTime: startTime,
                    playing: true
                }).catch(err => console.error(err));
            } else {
                console.error("Timesync not ready");
            }
        }
    }, [timesync, playing, stage]);

    return (
        <Panel>
            {enabled ? (
                <>
                    <Button onClick={toggleClick}>
                        {playing ? "Stop" : "Start"} click
                    </Button>
                </>
            ) : (
                <Button onClick={enableClick}>
                    Enable click
                </Button>
            )}

        </Panel>
    );
};
