import {MediasoupAudioTrack, MediasoupVideoTrack, MediaTrack, StageMemberOld} from "../lib/digitalstage/model";
import React from "react";
import {Input} from "baseui/input";
import VideoTrackPlayer from "./video/VideoTrackPlayer";

export default (props: {
    members: {
        [uid: string]: StageMemberOld
    }
}) => {
    console.log(props.members);

    const memberPanels = Object.values(props.members).map((member: StageMemberOld) => {
        const trackViews = Object.values(member.tracks).map((track: MediaTrack) => {
            if (track.type === "audio") {
                const audioTrack: MediasoupAudioTrack = track as MediasoupAudioTrack;
                return (
                    <div key={audioTrack.id}>
                        <Input value={audioTrack.volume}
                               type="number"
                               onChange={(e) => audioTrack.setVolume(parseInt(e.currentTarget.value))}/>
                    </div>
                )
            } else if (track.type === "video") {
                const videoTrack: MediasoupVideoTrack = track as MediasoupVideoTrack;
                return (
                    <VideoTrackPlayer key={videoTrack.id} track={videoTrack.track}/>
                )
            }
        })

        return (
            <div key={member.uid}>
                <h3>{member.displayName}</h3>
                {trackViews}
            </div>
        );
    });


    return (
        <div>
            {memberPanels}
        </div>
    );
}
