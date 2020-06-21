import {IAudioProducer, IMember, ISoundjack, IVideoProducer} from "./useStage";
import {DigitalStageAPI} from "./base";
import {MemberEvent, ProducerEvent, VolumeEvent} from "./base/api/DigitalStageAPI";
import {Consumer} from "./mediasoup/types/Consumer";
import {useReducer} from "react";

export const ACTION_TYPES = {
    ADD_MEMBER: 'addMember',
    CHANGE_MEMBER: 'changeMember',
    REMOVE_MEMBER: 'removeMember',
    ADD_PRODUCER: 'addProducer',
    CHANGE_PRODUCER: 'changeProducer',
    REMOVE_PRODUCER: 'removeProducer',
    ADD_SOUNDJACK: 'addSoundjack',
    CHANGE_SOUNDJACK: 'changeSoundjack',
    REMOVE_SOUNDJACK: 'removeSoundjack',
    CHANGE_VOLUME: 'changeVolume',
    ADD_CONSUMER: 'addConsumer',
    REMOVE_CONSUMER: 'removeConsumer'
};

export interface Store {
    members: IMember[],
    videoProducers: {
        [uid: string]: IVideoProducer[]
    },
    audioProducers: {
        [uid: string]: IAudioProducer[]
    },
    soundjacks: {
        [uid: string]: ISoundjack[]
    },
    volumes: {
        [uid: string]: number
    }
}

export const initialState: Store = {
    members: [],
    videoProducers: {},
    audioProducers: {},
    soundjacks: {},
    volumes: {}
}

const handleActions = {
    [ACTION_TYPES.ADD_MEMBER]: (store: Store, payload: { api: DigitalStageAPI, event: MemberEvent }): Store => ({
        ...store,
        members: [...store.members, {
            uid: payload.event.uid,
            name: payload.event.member.displayName,
            online: payload.event.member.online,
            videoProducers: store.videoProducers[payload.event.uid] ? [...store.videoProducers[payload.event.uid]] : [],
            audioProducers: store.audioProducers[payload.event.uid] ? [...store.audioProducers[payload.event.uid]] : [],
            soundjacks: store.soundjacks[payload.event.uid] ? [...store.soundjacks[payload.event.uid]] : [],
            volume: store.volumes[payload.event.uid] || 0,
            setVolume: v => payload.api.setRemoteMasterVolume(payload.event.uid, v)
        }]
    }),
    [ACTION_TYPES.CHANGE_MEMBER]: (store: Store, payload: { event: MemberEvent }): Store => ({
        ...store,
        members: store.members.map(m => m.uid === payload.event.uid ? {
            ...m,
            name: payload.event.member.displayName,
            online: payload.event.member.online
        } : m)
    }),
    [ACTION_TYPES.REMOVE_MEMBER]: (store: Store, payload: { event: MemberEvent }): Store => ({
        ...store,
        members: store.members.filter(m => m.uid !== payload.event.uid)
    }),
    [ACTION_TYPES.ADD_PRODUCER]: (store: Store, payload: { api: DigitalStageAPI, event: ProducerEvent }): Store => {
        if (payload.event.producer.kind === "audio") {
            const producer: IAudioProducer = {
                id: payload.event.id,
                volume: payload.event.producer.kind === "audio" ? payload.event.producer.volume || 0 : undefined,
                setVolume: payload.event.producer.kind === "audio" ? v => payload.api.setRemoteProducerVolume(payload.event.id, v) : undefined
            }
            return {
                ...store,
                audioProducers: {
                    ...store.audioProducers,
                    [payload.event.producer.uid]: store.audioProducers[payload.event.producer.uid] ? [...store.audioProducers[payload.event.producer.uid], producer] : [producer],
                },
                members: store.members.map(m => m.uid === payload.event.producer.uid ? {
                    ...m,
                    audioProducers: [...m.audioProducers, producer]
                } : m)
            }
        } else {
            const producer: IVideoProducer = {
                id: payload.event.id,
            }
            return {
                ...store,
                videoProducers: {
                    ...store.audioProducers,
                    [payload.event.producer.uid]: store.audioProducers[payload.event.producer.uid] ? [...store.audioProducers[payload.event.producer.uid], producer] : [],
                },
                members: store.members.map(m => m.uid === payload.event.producer.uid ? {
                    ...m,
                    videoProducers: [...m.audioProducers, producer]
                } : m)
            }
        }
    },
    [ACTION_TYPES.CHANGE_PRODUCER]: (store: Store, payload: { event: ProducerEvent }): Store => payload.event.producer.kind === "audio" ? {
        ...store,
        audioProducers: {
            ...store.audioProducers,
            [payload.event.producer.uid]: store.audioProducers[payload.event.producer.uid].map(ap => ap.id === payload.event.id ? {
                ...ap,
                volume: payload.event.producer.volume
            } : ap)
        },
        members: store.members.map(m => m.uid === payload.event.producer.uid ? {
            ...m,
            audioProducers: m.audioProducers.map(ap => ap.id === payload.event.id ? {
                ...ap,
                volume: payload.event.producer.volume
            } : ap)
        } : m)
    } : store,
    [ACTION_TYPES.REMOVE_PRODUCER]: (store: Store, payload: { event: ProducerEvent }): Store => {
        if (payload.event.producer.kind === "audio") {
            return {
                ...store,
                audioProducers: {
                    ...store.audioProducers,
                    [payload.event.producer.uid]: store.audioProducers[payload.event.producer.uid].filter(ap => ap.id !== payload.event.id)
                },
                members: store.members.map(m => m.uid === payload.event.producer.uid ? {
                    ...m,
                    audioProducers: m.audioProducers.filter(ap => ap.id !== payload.event.id)
                } : m)
            }
        } else {
            return {
                ...store,
                videoProducers: {
                    ...store.videoProducers,
                    [payload.event.producer.uid]: store.videoProducers[payload.event.producer.uid].filter(ap => ap.id !== payload.event.id)
                },
                members: store.members.map(m => m.uid === payload.event.producer.uid ? {
                    ...m,
                    videoProducers: m.videoProducers.filter(ap => ap.id !== payload.event.id)
                } : m)
            }
        }
    },
    [ACTION_TYPES.CHANGE_VOLUME]: (store: Store, payload: { event: VolumeEvent }): Store => ({
        ...store,
        volumes: {
            ...store.volumes,
            [payload.event.uid]: payload.event.volume
        },
        members: store.members.map(m => m.uid === payload.event.uid ? {
            ...m,
            volume: payload.event.volume
        } : m)
    }),
    [ACTION_TYPES.ADD_CONSUMER]: (store: Store, payload: { consumer: Consumer }): Store => {
        if (payload.consumer.globalProducer.kind === "audio") {
            return {
                ...store,
                members: store.members.map(m => m.uid === payload.consumer.globalProducer.uid ? {
                    ...m,
                    audioProducers: m.audioProducers.map(ap => ap.id === payload.consumer.globalProducer.id ? {
                        ...ap,
                        consumer: {
                            id: payload.consumer.consumer.id,
                            track: payload.consumer.consumer.track
                        }
                    } : ap)
                } : m),
                audioProducers: {
                    ...store.audioProducers,
                    [payload.consumer.globalProducer.uid]: store.audioProducers[payload.consumer.globalProducer.uid].map(ap => ap.id === payload.consumer.globalProducer.id ? {
                        ...ap,
                        consumer: {
                            id: payload.consumer.consumer.id,
                            track: payload.consumer.consumer.track
                        }
                    } : ap)
                }
            }
        } else {
            return {
                ...store,
                members: store.members.map(m => m.uid === payload.consumer.globalProducer.uid ? {
                    ...m,
                    videoProducers: m.videoProducers.map(ap => ap.id === payload.consumer.globalProducer.id ? {
                        ...ap,
                        consumer: {
                            id: payload.consumer.consumer.id,
                            track: payload.consumer.consumer.track
                        }
                    } : ap)
                } : m),
                videoProducers: {
                    ...store.videoProducers,
                    [payload.consumer.globalProducer.uid]: store.videoProducers[payload.consumer.globalProducer.uid].map(ap => ap.id === payload.consumer.globalProducer.id ? {
                        ...ap,
                        consumer: {
                            id: payload.consumer.consumer.id,
                            track: payload.consumer.consumer.track
                        }
                    } : ap)
                }
            }
        }
    },
    [ACTION_TYPES.REMOVE_CONSUMER]: (store: Store, payload: { consumer: Consumer }): Store => {
        if (payload.consumer.globalProducer.kind === "audio") {
            return {
                ...store,
                members: store.members.map(m => m.uid === payload.consumer.globalProducer.uid ? {
                    ...m,
                    audioProducers: m.audioProducers.map(ap => ap.id === payload.consumer.globalProducer.id ? {
                        ...ap,
                        consumer: undefined
                    } : ap)
                } : m),
                audioProducers: {
                    ...store.audioProducers,
                    [payload.consumer.globalProducer.uid]: store.audioProducers[payload.consumer.globalProducer.uid].map(ap => ap.id === payload.consumer.globalProducer.id ? {
                        ...ap,
                        consumer: undefined
                    } : ap)
                }
            }
        } else {
            return {
                ...store,
                members: store.members.map(m => m.uid === payload.consumer.globalProducer.uid ? {
                    ...m,
                    videoProducers: m.videoProducers.map(ap => ap.id === payload.consumer.globalProducer.id ? {
                        ...ap,
                        consumer: undefined
                    } : ap)
                } : m),
                videoProducers: {
                    ...store.videoProducers,
                    [payload.consumer.globalProducer.uid]: store.videoProducers[payload.consumer.globalProducer.uid].map(ap => ap.id === payload.consumer.globalProducer.id ? {
                        ...ap,
                        consumer: undefined
                    } : ap)
                }
            }
        }
    }
}

export const reducer = (store, action) => Boolean(handleActions[action.type]) ? handleActions[action.type](store, action) : store;

export const useStageReducer = () => useReducer(reducer, initialState, undefined);