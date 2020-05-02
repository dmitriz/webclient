import omit from 'lodash.omit';
import {ISoundjackDevice, ISoundjackDeviceEventListener, ISoundjackStream} from "./ISoundjackDevice";

export default class SoundjackLocalDevice implements ISoundjackDevice {
    private eventListener: ISoundjackDeviceEventListener[];
    private readonly websocket: WebSocket;


    constructor(ip: string, port: number) {
        if (typeof window !== "undefined")
            window.addEventListener("beforeunload", (ev) => {
                ev.preventDefault();
                this.disconnect();
            });
        this.websocket = new WebSocket("ws://" + ip + ":" + port);
    }

    private disconnect(): void {

        if (this.websocket) {
            this.websocket.close();
        }
    }

    addEventListener(eventListener: ISoundjackDeviceEventListener): void {
        this.eventListener.push(eventListener);
    }

    getAudioDevices(): { [p: number]: string } {
        return {};
    }

    getIncomingStreams(): { [p: string]: ISoundjackStream } {
        return {};
    }

    getOutgoingStreams(): { [p: string]: ISoundjackStream } {
        return {};
    }

    removeEventListener(eventListener: ISoundjackDeviceEventListener): void {
        this.eventListener = omit(this.eventListener, eventListener);
    }

    setAudioInputDevice(audioDeviceId: number): void {
    }

    setAudioOutputDevice(audioDeviceId: number): void {
    }

    setBufferSize(bufferSize: number): void {
    }

    setFrameSize(frameSize: number): void {
    }

    setInputVolume(level: number): void {
    }

    setRemoteBufferSizeLevel(targetIp: string, targetPort: number, level: number): void {
    }

    setRemoteVolume(sourceIp: string, sourcePort: number, level: number): void {
    }


    stopStream(targetIp: string, targetPort: number): void {
    }

    getStreams(): ISoundjackStream[] {
        return [];
    }

    setMonitorVolume(level: number): void {
    }

    startStream(remoteIp: string, remotePort: number): string {
        return "";
    }

}
