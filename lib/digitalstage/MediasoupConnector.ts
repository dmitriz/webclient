import {useCallback, useEffect, useState} from "react";
import omit from "lodash.omit";
import firebase from "firebase/app";
import "firebase/firestore";
import mediasoup from "mediasoup-client";
import {Observable} from "rxjs";
import {MediasoupProducer} from "./databaseModels";

interface StageMemberMediasoupTracks {
    uid: string;
    audioTracks: AudioNode,
    videoTracks: MediaStreamTrack[]
}

const getAudioTracks = (): Promise<MediaStreamTrack[]> => {
    return navigator.mediaDevices
        .getUserMedia({
            video: false,
            "audio": {
                echoCancellation: false,
                autoGainControl: false,
                noiseCancellation: false,
                mandatory: {
                    googEchoCancellation: false,
                    googAutoGainControl: false,
                    googNoiseSuppression: false,
                    googHighpassFilter: false
                },
                "optional": []
            } as any,
        })
        .then((stream: MediaStream) => stream.getAudioTracks())
}
const getVideoTracks = (): Promise<MediaStreamTrack[]> => {
    return navigator.mediaDevices
        .getUserMedia({
            audio: false,
            video: true,
        })
        .then((stream: MediaStream) => stream.getVideoTracks())
}

interface MediasoupConsumer {
    uid: string;
    consumer: mediasoup.types.Consumer,
}

export const useMediasoup = (props: {
    stageId: string
}) => {
    //TODO @Jan: ALTERNATIVE: Using an observer? Or shall we write this outside a hook? And just use the useStage hook for this?
    const [consumerObservable, setConsumerObservable] = useState<Observable<MediasoupConsumer>>();
    const [consumers, setConsumers] = useState<{
        [globalProducerId: string]: MediasoupConsumer
    }>();
    const [receiveAudio, setReceiveAudio] = useState<boolean>();
    const [receiveVideo, setReceiveVideo] = useState<boolean>();
    const [streamAudio, setStreamAudio] = useState<boolean>();
    const [streamVideo, setStreamVideo] = useState<boolean>();
    const [streamingAudioTracks, setStreamingAudioTracks] = useState<{
        [trackId: string]: MediaStreamTrack
    }>({});
    const [streamingVideoTracks, setStreamingVideoTracks] = useState<{
        [trackId: string]: MediaStreamTrack
    }>({});

    const startProducing = useCallback((track: MediaStreamTrack) => {
        //TODO: START PRODUCING AND THEN
        setStreamingAudioTracks(prev => ({...prev, [track.id]: track}));
    }, []);

    const stopProducing = useCallback((trackId: string) => {
        //TODO: STOP PRODUCING AND THEN
        setStreamingAudioTracks(prev => omit(trackId, prev));
    }, []);

    const startConsuming = useCallback((producer: MediasoupProducer) => {
        //TODO: START CONSUMING
    }, []);

    const stopConsuming = useCallback((globalProducerId: string) => {
        //TODO: STOP CONSUMING
    }, []);

    useEffect(() => {
        if (props.stageId) {
            if (receiveAudio) {
                firebase.firestore()
                    .collection("producers/mediasoup")
                    .where("stageId", "==", props.stageId)
                    .where("kind", "==", "audio")
                    .onSnapshot((snapshot: firebase.firestore.QuerySnapshot) => {
                        snapshot.docs
                            .filter(doc => !consumers[doc.id])
                            .forEach(doc => {
                                startConsuming(doc.data() as MediasoupProducer);
                            });
                        // And clean up
                        Object.keys(consumers)
                            .forEach((globalProducerId: string) => {
                                if (!snapshot.docs.find((doc) => doc.id === globalProducerId)) {
                                    stopConsuming(globalProducerId);
                                }
                            })

                    })
            } else {
                Object.keys(consumers)
                    .forEach((globalProducerId: string) => {
                        stopConsuming(globalProducerId);
                    });
            }
        }
    }, [props.stageId, receiveAudio]);

    useEffect(() => {
        if (props.stageId) {
            if (receiveAudio) {
                firebase.firestore()
                    .collection("producers/mediasoup")
                    .where("stageId", "==", props.stageId)
                    .where("kind", "==", "video")
                    .onSnapshot((snapshot: firebase.firestore.QuerySnapshot) => {
                        snapshot.docs
                            .filter(doc => !consumers[doc.id])
                            .forEach(doc => {
                                startConsuming(doc.data() as MediasoupProducer);
                            });
                        // And clean up
                        //TODO: This removed all, check kind before!!!
                        Object.keys(consumers)
                            .forEach((globalProducerId: string) => {
                                if (!snapshot.docs.find((doc) => doc.id === globalProducerId)) {
                                    stopConsuming(globalProducerId);
                                }
                            })

                    })
            } else {
                Object.keys(consumers)
                    .forEach((globalProducerId: string) => {
                        stopConsuming(globalProducerId);
                    });
            }
        }
    }, [props.stageId, receiveVideo]);

    useEffect(() => {
        if (props.stageId) {
            if (streamAudio) {
                getAudioTracks()
                    .then(tracks =>
                        tracks
                            .filter(track => !streamingAudioTracks[track.id])
                            .forEach(
                                (track: MediaStreamTrack) => startProducing(track)
                            ))
            } else {
                Object.keys(streamingAudioTracks)
                    .forEach((trackId: string) => stopProducing(trackId));
            }
        }
    }, [props.stageId, streamAudio]);

    useEffect(() => {
        if (props.stageId) {
            if (streamVideo) {
                getVideoTracks()
                    .then(tracks =>
                        tracks
                            .filter(track => !streamingVideoTracks[track.id])
                            .forEach(
                                (track: MediaStreamTrack) => startProducing(track)
                            ))
            } else {
                Object.keys(streamingVideoTracks)
                    .forEach((trackId: string) => stopProducing(trackId));
            }
        }
    }, [props.stageId, streamVideo]);


    return {
        consumerObservable,
        consumers,
        setReceiveAudio,
        setReceiveVideo,
        setStreamAudio,
        setStreamVideo
    }
};

/*
// Maybe without hooks possible?:
export default class MediasoupConnector {
    private streamingVideoTracks: MediaStreamTrack[];
    private streamingAudioTracks: MediaStreamTrack[];
    private isStreamingVideo = (): boolean => this.streamingVideoTracks.length > 0;
    private isStreamingAudio = (): boolean => this.streamingAudioTracks.length > 0;

    public static startReceivingVideo = () => {
    }

    public static stopReceivingVideo = () => {

    }

    public static startReceivingAudio = () => {

    }

    public static stopReceivingAudio = () => {

    }

    public static startStreamingVideo = (): Promise<void> => {
        return navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false
        })
            .then((stream: MediaStream) => stream.getVideoTracks().forEach((track: MediaStreamTrack) => MediasoupConnector.produce(track)));
    }

    public static startStreamingAudio = (): Promise<void> => {

        return navigator.mediaDevices.getUserMedia({
            video: false,
            audio: true //TODO: Add high quality options
        })
            .then((stream: MediaStream) => stream.getAudioTracks().forEach((track: MediaStreamTrack) => MediasoupConnector.produce(track)));
    }

    public static stopStreamingAudio = (): Promise<void> => {
        return null;
    }
    public static stopStreamingVideo = (): Promise<void> => {
        return null;

    }

    private getAudioTracks = (): Promise<MediaStreamTrack[]> => {
        return navigator.mediaDevices
            .getUserMedia({
                video: false,
                "audio": {
                    echoCancellation: false,
                    autoGainControl: false,
                    noiseCancellation: false,
                    mandatory: {
                        googEchoCancellation: false,
                        googAutoGainControl: false,
                        googNoiseSuppression: false,
                        googHighpassFilter: false
                    },
                    "optional": []
                } as any,
            })
            .then((stream: MediaStream) => stream.getAudioTracks())
    }

    private getVideoTracks = (): Promise<MediaStreamTrack[]> => {
        return navigator.mediaDevices
            .getUserMedia({
                audio: false,
                video: true,
            })
            .then((stream: MediaStream) => stream.getVideoTracks())
    }

    private static startProducing = (track: MediaStreamTrack): Promise<void> => {
        //TODO: Create producer and publish it in firestore
        return null;
    }

    private static stopProducing = (track: MediaStreamTrack): Promise<void> => {
        //TODO: Stop producer and depublish it in firestore
        return null;
    }

}