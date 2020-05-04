export interface ISoundjackDeviceEventListener {
    //TODO: Replace with javascript commons event maps (compare event handler of dom)
    onConnected: () => void;
    onDisconnected: () => void;

    onStreamAdded: () => void;
    onStreamActivated: () => void;
    onStreamDeactivated: () => void;
    onStreamRemoved: () => void;

    onFrameSizeChanged: (frameSize: number) => void;
    onBufferSizeChanged: (bufferSize: number) => void;
    onRemoteBufferSizeChanged: (ip: string, port: number, level: number) => void;
    onMonitorVolumeChanged: (level: number) => void;

    onAudioDeviceAdded: (audioDeviceId: number, name: string) => void;  // Never removed ... and not really dynamically added
    onAudioInputDeviceChanged: (audioDeviceId: number, name: string) => void;
    onAudioOutputDeviceChanged: (audioDeviceId: number, name: string) => void;
}

export interface ISoundjackStream {
    channelCount: number
    decodeFactor: number
    frameSize: number
}

export interface ISoundjackDevice {
    /**
     * Adds an event listener
     * @param eventListener
     */
    addEventListener(eventListener: ISoundjackDeviceEventListener): void;

    /**
     * Removes the given event listener
     * @param eventListener
     */
    removeEventListener(eventListener: ISoundjackDeviceEventListener): void;

    /**
     * Returns the available audio devices with a name, ordered by their audioDeviceIDs
     */
    getAudioDevices(): { [audioDeviceId: number]: string };

    /**
     * Set the input device
     * @param audioDeviceId
     */
    setAudioInputDevice(audioDeviceId: number): void;

    /**s
     * Set the output device
     * @param audioDeviceId
     */
    setAudioOutputDevice(audioDeviceId: number): void;

    /**
     * Sets the monitore volume or gain of this device
     * @param level
     */
    setMonitorVolume(level: number): void;

    /**
     * Set the volume of the incoming remote stream with given ip and port
     * @param remoteIp
     * @param remotePort
     * @param level
     */
    setRemoteVolume(remoteIp: string, remotePort: number, level: number): void;

    /**
     * @param remoteIp
     * @param remotePort
     * @param level between 1 and 15
     */
    setRemoteBufferSizeLevel(remoteIp: string, remotePort: number, level: number): void;

    /**
     * Start streaming to the given ip and port
     * @param remoteIp
     * @param remotePort
     * @return uri of ip and port, e.g. "192.168.2.1:50000", use this URI for further communication
     */
    startStream(remoteIp: string, remotePort: number): string;


    /**
     * Specify the frame size
     * @param frameSize
     */
    setFrameSize(frameSize: number): void;

    /**
     * Specify the buffer size
     * @param bufferSize
     */
    setBufferSize(bufferSize: number): void;


    /**
     * Stop streaming to the given ip and port
     * @param remoteIp
     * @param remotePort
     */
    stopStream(remoteIp: string, remotePort: number): void;

    /**
     * Returns the current streams
     */
    getStreams(): ISoundjackStream[];
}

