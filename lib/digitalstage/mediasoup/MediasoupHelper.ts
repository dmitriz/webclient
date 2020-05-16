import firebase from 'firebase/app';
import 'firebase/firestore';
import {MediasoupRouter} from "../databaseModels";
import mediasoup from "mediasoup-client";
import {ConnectTransportPayload, MediasoupGetUrls, MediasoupPostUrls} from "./events";
import {RtpCapabilities} from "mediasoup-client/lib/RtpParameters";
import fetch from "isomorphic-unfetch";
import {TransportOptions} from "mediasoup-client/lib/Transport";

interface MediasoupConnection {
    serverAddress: string;
    router: MediasoupRouter;
    device?: mediasoup.Device;
    sendTransport?: mediasoup.types.Transport;
    receiveTransport?: mediasoup.types.Transport;
}

export class MediasoupHelper {
    private static NEARBY_ROUTERS: MediasoupRouter[];
    private static NEARBY_ROUTER: MediasoupRouter;
    private connection: MediasoupConnection;
    private user: firebase.User;

    constructor(user: firebase.User) {
        this.user = user;
    }

    getNearbyRouters = (): Promise<MediasoupRouter[]> => {
        return new Promise((resolve => {
            if (MediasoupHelper.NEARBY_ROUTERS) {
                return resolve(MediasoupHelper.NEARBY_ROUTERS);
            }
            //TODO: Localize
            return firebase.firestore()
                .collection("routers")
                .get()
                .then((snapshot: firebase.firestore.QuerySnapshot) => {
                    MediasoupHelper.NEARBY_ROUTERS = snapshot.docs.map((doc: firebase.firestore.QueryDocumentSnapshot) => doc.data() as MediasoupRouter);
                });
        }));
    }

    getNearestRouter = (): Promise<MediasoupRouter> => {
        return new Promise((resolve => {
            if (MediasoupHelper.NEARBY_ROUTER) {
                return resolve(MediasoupHelper.NEARBY_ROUTER);
            } else {
                // TODO: Estimate the nearest router
                return this.getNearbyRouters()
                    .then((nearbyRouters: MediasoupRouter[]) => nearbyRouters[0]);
            }
        }));
    }

    getConsumer = async (producerId: string) => {
        if (!this.connection) {
            await this.connect(this.user, await this.getNearestRouter());
        }
        this.user.getIdToken()
            .then(token => fetch(this.connection.serverAddress + MediasoupPostUrls.ConsumeWebRTC, {
                    headers: {
                        authorization: token
                    },
                    body: JSON.stringify({
                        producerId: producerId,
                        transportId: this.connection.receiveTransport.id,
                    })
                })
            )
            .then(response => response.json())
            .then(data => )
        ;


    }

    private connect = async (user: firebase.User, router: MediasoupRouter) => {
        if (this.connection) {
            this.disconnect();
        }
        const serverAddress: string = "https://" + router.ipv6 + ":" + router.port;
        const rtpCapabilities: RtpCapabilities = await this.getRtpCapabilities(serverAddress);
        const device: mediasoup.Device = new mediasoup.Device();
        await device.load({routerRtpCapabilities: rtpCapabilities});
        const sendTransport: mediasoup.types.Transport = await this.createWebRTCTransport(user, serverAddress, device, "send");
        const receiveTransport: mediasoup.types.Transport = await this.createWebRTCTransport(user, serverAddress, device, "send");
        this.connection = {
            serverAddress: serverAddress,
            router: router,
            sendTransport: sendTransport,
            receiveTransport: receiveTransport
        }
    }

    disconnect = () => {

    }

    getRtpCapabilities = (serverAddress: string): Promise<RtpCapabilities> => {
        return fetch(serverAddress + MediasoupGetUrls.GetRTPCapabilities)
            .then(response => response.json());
    }

    createWebRTCTransport = (user: firebase.User, serverAddress: string, device: mediasoup.Device, type: "send" | "receive"): Promise<mediasoup.types.Transport> => {
        return user.getIdToken()
            .then((token: string) => {
                return fetch(serverAddress + MediasoupGetUrls.CreateWebRTCTransport, {
                    headers: {
                        authorization: token
                    }
                })
                    .then((response) => response.json())
                    .then((transportOptions: TransportOptions) => {
                        const transport: mediasoup.types.Transport = (type === "send" ? device.createSendTransport(transportOptions) : device.createRecvTransport(transportOptions));
                        transport.on('connect', async ({dtlsParameters}, callback, errCallback) => {
                            return user.getIdToken()
                                .then((token) => {
                                    fetch(serverAddress + MediasoupPostUrls.ConnectTransport, {
                                        headers: {
                                            authorization: token
                                        },
                                        body: JSON.stringify({
                                            transportId: transport.id
                                        } as ConnectTransportPayload)
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
                                return user.getIdToken()
                                    .then((token) => {
                                        return fetch(serverAddress + MediasoupPostUrls.SendTrack, {
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