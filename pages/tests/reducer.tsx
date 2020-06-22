import {ACTION_TYPES, useStageReducer} from "../../lib/digitalstage/stage.reducer";
import {useEffect, useState} from "react";
import {DigitalStageAPI} from "../../lib/digitalstage/base";
import {DigitalStageMockupAPI} from "../../lib/digitalstage/base/api/DigitalStageMockupAPI";
import {MemberEvent, ProducerEvent, SoundjackEvent, VolumeEvent} from "../../lib/digitalstage/base/api/DigitalStageAPI";
import {v4 as uuidv4} from 'uuid';

const uid: string = uuidv4();

export default () => {
    const [store, dispatch] = useStageReducer();
    const [api, setApi] = useState<DigitalStageAPI>();

    useEffect(() => {
        setApi(new DigitalStageMockupAPI());
    }, []);

    return (
        <div>
            <div>
                <h1>Members</h1>
                <ul>
                    {store.members.map(m => (
                        <li>
                            {m.name} with volume={m.volume}
                            <h2>Audio Producers</h2>
                            <ul>
                                {m.audioProducers.map(ap => (
                                    <li>
                                        {ap.id}
                                    </li>
                                ))}
                            </ul>
                            <h2>Video Producers</h2>
                            <ul>
                                {m.videoProducers.map(ap => (
                                    <li>
                                        {ap.id}
                                    </li>
                                ))}
                            </ul>
                            <h2>Soundjacks</h2>
                            <ul>
                                {m.soundjacks.map(ap => (
                                    <li>
                                        {ap.id}
                                    </li>
                                ))}
                            </ul>
                        </li>
                    ))}
                </ul>
                <h1>Audio producers</h1>
                <ul>
                    {Object.keys(store.audioProducers).map(uid => (
                        <li>
                            {uid}
                            <ul>
                                {store.audioProducers[uid].map(ap => (
                                    <li>
                                        {ap.id}
                                    </li>
                                ))}
                            </ul>
                        </li>
                    ))}
                </ul>
                <h1>Video producers</h1>
                <ul>
                    {Object.keys(store.videoProducers).map(uid => (
                        <li>
                            {uid}
                            <ul>
                                {store.videoProducers[uid].map(ap => (
                                    <li>
                                        {ap.id}
                                    </li>
                                ))}
                            </ul>
                        </li>
                    ))}
                </ul>
                <h1>Soundjacks</h1>
                <ul>
                    {Object.keys(store.soundjacks).map(uid => (
                        <li>
                            {uid}
                            <ul>
                                {store.soundjacks[uid].map(ap => (
                                    <li>
                                        {ap.id}
                                    </li>
                                ))}
                            </ul>
                        </li>
                    ))}
                </ul>
                <h1>Volumes</h1>
                <ul>
                    {Object.keys(store.volumes).map(uid => (
                        <li>
                            {uid}: {store.volumes[uid]}
                        </li>
                    ))}
                </ul>
            </div>
            <button onClick={() => {
                const event: ProducerEvent = {
                    id: uuidv4(),
                    producer: {
                        uid: uid,
                        deviceId: "123",
                        volume: 0,
                        routerId: "123",
                        kind: "audio",
                        producerId: "123"
                    }
                };
                return dispatch({
                    type: ACTION_TYPES.ADD_PRODUCER,
                    api: api,
                    event: event
                })
            }
            }>
                Add Producer
            </button>
            <button onClick={() => {
                if (store.audioProducers[uid] && store.audioProducers[uid].length > 0) {
                    const producer = store.audioProducers[uid][0];
                    const event: ProducerEvent = {
                        id: producer.id,
                        producer: {
                            uid: uid,
                            deviceId: "123",
                            volume: 0,
                            routerId: "123",
                            kind: "audio",
                            producerId: "123"
                        }
                    };
                    return dispatch({
                        type: ACTION_TYPES.REMOVE_PRODUCER,
                        api: api,
                        event: event
                    })
                }
            }}>
                Remove Producer
            </button>

            <button onClick={() => {
                const event: ProducerEvent = {
                    id: uuidv4(),
                    producer: {
                        uid: uid,
                        deviceId: "123",
                        volume: 0,
                        routerId: "123",
                        kind: "video",
                        producerId: "123"
                    }
                };
                return dispatch({
                    type: ACTION_TYPES.ADD_PRODUCER,
                    api: api,
                    event: event
                })
            }
            }>
                Add Video Producer
            </button>
            <button onClick={() => {
                if (store.videoProducers[uid] && store.videoProducers[uid].length > 0) {
                    const producer = store.videoProducers[uid][0];
                    const event: ProducerEvent = {
                        id: producer.id,
                        producer: {
                            uid: uid,
                            deviceId: "123",
                            volume: 0,
                            routerId: "123",
                            kind: "video",
                            producerId: "123"
                        }
                    };
                    return dispatch({
                        type: ACTION_TYPES.REMOVE_PRODUCER,
                        api: api,
                        event: event
                    })
                }
            }}>
                Remove Video Producer
            </button>

            <button onClick={() => {
                const event: SoundjackEvent = {
                    id: uuidv4(),
                    soundjack: {
                        uid: uid,
                        deviceId: "123",
                        ipv4: "",
                        ipv6: "",
                        port: 50050,
                        volume: 0
                    }
                };
                return dispatch({
                    type: ACTION_TYPES.ADD_SOUNDJACK,
                    api: api,
                    event: event
                })
            }
            }>
                Add Soundjack
            </button>
            <button onClick={() => {
                if (store.soundjacks[uid] && store.soundjacks[uid].length > 0) {
                    const soundjack = store.soundjacks[uid][0];
                    const event: SoundjackEvent = {
                        id: soundjack.id,
                        soundjack: {
                            uid: uid,
                            deviceId: "123",
                            ipv4: "",
                            ipv6: "",
                            port: 50050,
                            volume: 0
                        }
                    };
                    return dispatch({
                        type: ACTION_TYPES.REMOVE_SOUNDJACK,
                        api: api,
                        event: event
                    })
                }
            }}>
                Remove Soundjack
            </button>

            <button onClick={() => {
                const event: MemberEvent = {
                    uid: uid,
                    member: {
                        displayName: "Blubb",
                        online: true
                    }
                };
                return dispatch({
                    type: store.members.length > 0 ? ACTION_TYPES.REMOVE_MEMBER : ACTION_TYPES.ADD_MEMBER,
                    event: event
                })
            }}>
                Toggle member
            </button>

            <input type="number" onChange={(e) => {
                const event: VolumeEvent = {
                    uid: uid,
                    volume: parseInt(e.currentTarget.value)
                }
                return dispatch({
                    type: ACTION_TYPES.CHANGE_VOLUME,
                    event: event
                })
            }}/>

        </div>
    )
}
