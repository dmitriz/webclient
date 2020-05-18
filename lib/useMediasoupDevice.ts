import {useDevice} from "./useDevice";
import firebase from "firebase/app";
import "firebase/database";
import {useCallback, useEffect, useState} from "react";
import mediasoupClient from "mediasoup-client";
import fetch from "isomorphic-unfetch";
import {TransportOptions} from "mediasoup-client/lib/Transport";
import {DatabaseRouter} from "./model";

export const MediasoupGetUrls = {
    GetRTPCapabilities: "/rtp-capabilities",
    CreateWebRTCTransport: "/create-webrtc-transport",
    CreatePlainRTPTransport: "/create-plain-transport",
};
export const MediasoupPostUrls = {
    ConnectTransport: "/connect-transport",
    SendTrack: "/send-track",
    ConsumePlain: "/consume-plain",
    ConsumeWebRTC: "/consume-webrtc",
    FinishConsume: "/finish-consume"
};

interface Producer {
    routerId: string;
}

export const useMediasoupDevice = (user: firebase.User) => {
    const [userRef, setUserRef] = useState<firebase.database.Reference>();
    const [mediasoupConnection, setMediasoupConnection] = useState<MediasoupConnection>();
    const [consumers, setConsumers] = useState<{
        [producerId: string]: mediasoupClient.types.Consumer
    }>();
    const device = useDevice(user, {
        canVideo: true,
        canAudio: true
    });

    const onProducerAdded = useCallback(async () => {
        if (!mediasoupConnection.isConnected()) {
            await mediasoupConnection.connect();
        }
        // Consume producer

    }, [mediasoupConnection]);

    const onProducerRemoved = useCallback(async () => {
        if (!mediasoupConnection.isConnected()) {
            await mediasoupConnection.connect();
        }
        // Consume producer

    }, [mediasoupConnection]);


    useEffect(() => {
        if (user) {
            setMediasoupConnection(new MediasoupConnection(user));
            setUserRef(
                firebase
                    .database()
                    .ref("users/" + user.uid)
            );
        }
    }, [user]);

    const publishAudio = useCallback(() => {

    }, []);

    const publishVideo = useCallback(() => {

    }, []);

    useEffect(() => {
        if (userRef) {
            const producersRef: firebase.database.Reference = userRef.child("producers");
            if (device.receiveAudio || device.receiveVideo) {
                producersRef
                    .on("child_added", onProducerAdded);
                producersRef
                    .on("child_removed", onProducerRemoved);
            } else {
                producersRef
                    .off("child_added", onProducerAdded);
                producersRef
                    .off("child_removed", onProducerRemoved);
            }
            mediasoupConnection.connect();
        }
    }, [userRef, device.receiveVideo, device.receiveAudio]);

    return {
        ...device,
        publishAudio,
        publishVideo
    }
};

const getNearestServer = (): Promise<string> => {
    //TODO: implement logic
    return firebase
        .database()
        .ref("routers")
        .limitToFirst(1)
        .once("child_added")
        .then((snapshot: firebase.database.DataSnapshot) => {
            const router: DatabaseRouter = snapshot.val();
            return "https://" + router.ipv6 + ":" + router.port;
        });
};

class MediasoupConnection {
    private readonly user: firebase.User;
    private readonly device: mediasoupClient.Device;
    private serverAddress: string = undefined
    private sendTransport: mediasoupClient.types.Transport;
    private receiveTransport: mediasoupClient.types.Transport;


    constructor(user: firebase.User) {
        this.user = user;
        this.device = new mediasoupClient.Device();
    }

    isConnected = (): boolean => {
        return this.serverAddress !== undefined;
    }

    public connect = async () => {
        if (this.isConnected()) {
            await this.disconnect();
        }
        this.serverAddress = await getNearestServer();
        console.log("Connecting to " + this.serverAddress);
        const rtpCapabilities: mediasoupClient.types.RtpCapabilities = await this.getRtpCapabilities(this.serverAddress);
        await this.device.load({routerRtpCapabilities: rtpCapabilities});
        this.sendTransport = await this.createWebRTCTransport("send");
        this.receiveTransport = await this.createWebRTCTransport("send");
    }

    public disconnect = async () => {
        if (this.sendTransport) {
            this.sendTransport.close();
        }
        if (this.receiveTransport) {
            this.receiveTransport.close();
        }
        this.serverAddress = undefined;
    }

    private getRtpCapabilities = (serverAddress: string): Promise<mediasoupClient.types.RtpCapabilities> => {
        return fetch(serverAddress + MediasoupGetUrls.GetRTPCapabilities)
            .then(response => response.json());
    }

    private createWebRTCTransport = (type: "send" | "receive"): Promise<mediasoupClient.types.Transport> => {
        return this.user.getIdToken()
            .then((token: string) => {
                return fetch(this.serverAddress + MediasoupGetUrls.CreateWebRTCTransport, {
                    headers: {
                        authorization: token
                    }
                })
                    .then((response) => response.json())
                    .then((transportOptions: TransportOptions) => {
                        const transport: mediasoupClient.types.Transport = (type === "send" ? this.device.createSendTransport(transportOptions) : this.device.createRecvTransport(transportOptions));
                        transport.on('connect', async ({dtlsParameters}, callback, errCallback) => {
                            return this.user.getIdToken()
                                .then((token) => {
                                    fetch(this.serverAddress + MediasoupPostUrls.ConnectTransport, {
                                        headers: {
                                            authorization: token
                                        },
                                        body: JSON.stringify({
                                            transportId: transport.id
                                        })
                                    })
                                        .then(() => callback())
                                        .catch((error) => errCallback(error));
                                })
                        });
                        transport.on('connectionstatechange', async (state) => {
                            console.log("mediasoup: connectionstatechange " + state);
                            if (state === 'closed' || state === 'failed' || state === 'disconnected') {
                                console.error("mediasoup: Disconnect by server side");
                            }
                        });
                        if (type === "send") {
                            transport.on('produce', async ({kind, rtpParameters, appData}, callback, errCallback) => {
                                console.log('c > s: stg/ms/send-track (kind=' + kind + ')');
                                return this.user.getIdToken()
                                    .then((token) => {
                                        return fetch(this.serverAddress + MediasoupPostUrls.SendTrack, {
                                            headers: {
                                                authorization: token
                                            },
                                            body: JSON.stringify({
                                                transportId: transport.id,
                                                kind: kind,
                                                rtpParameters: rtpParameters,
                                                appData: appData
                                            })
                                        })
                                            .then(response => response.json())
                                            .then(result => callback(result.id))
                                            .catch((error) => errCallback(error));
                                    });
                            });
                        }
                        return transport;
                    })
            })
    };
}
