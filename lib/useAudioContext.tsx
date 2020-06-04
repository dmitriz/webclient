import React, {Context, createContext, useCallback, useContext, useState} from "react";
import {AudioContext as RealAudioContext, IAudioContext} from "standardized-audio-context";
import webAudioTouchUnlock from "../util/webAudioTouchUnlock";

interface AudioContextProps {
    audioContext?: IAudioContext,

    createAudioContext(): Promise<IAudioContext>
}

const AudioContext: Context<AudioContextProps> = createContext<AudioContextProps>(undefined);

export const AudioContextProvider = (props: {
    children: React.ReactNode
}) => {
    const [context, setContext] = useState<IAudioContext>(undefined);

    const createAudioContext = useCallback(async () => {
        const audioContext: IAudioContext = new RealAudioContext();
        return webAudioTouchUnlock(audioContext)
            .then((unlocked: boolean) => {
                if (unlocked) {
                    // AudioContext was unlocked from an explicit user action, sound should start playing now
                } else {
                    // There was no need for unlocking, devices other than iOS
                }
                setContext(audioContext);
                return audioContext;
            });
    }, []);

    return (
        <AudioContext.Provider value={{
            audioContext: context,
            createAudioContext: createAudioContext
        }}>
            {props.children}
        </AudioContext.Provider>
    );
};

export const useAudioContext = () => useContext<AudioContextProps>(AudioContext);