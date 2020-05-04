import {ISoundjackDevice, ISoundjackDeviceEventListener, ISoundjackStream} from "./ISoundjackDevice";

export default class SoundjackRemoteDevice implements ISoundjackDevice {
    addEventListener(eventListener: ISoundjackDeviceEventListener): void {
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
