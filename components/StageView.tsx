import {Participant, Stage} from "../lib/communication/Connection";
import React from "react";
import VideoTrackPlayer from "./video/VideoTrackPlayer";

export default (props: {
    stage: Stage;
    participants: Participant[];
}) => {

    return (
        <>
            {props.participants.map((participant: Participant) => participant.videoTracks.map((track: MediaStreamTrack) => {
                console.log(track);
                return <VideoTrackPlayer key={track.id} track={track}/>;
            }))}
        </>
    );
};
