import {act, renderHook} from '@testing-library/react-hooks'
import {ACTION_TYPES, initialState, reducer, Store} from "./stage.reducer";
import {expect} from "@jest/globals";
import {useReducer} from "react";
import {DigitalStageAPI, IDebugger, IDevice} from "./base";

test('initial store is empty', () => {
    const {result} = renderHook(() => useReducer<typeof reducer, Store>(reducer, initialState, undefined));
    let [state, dispatch] = result.current;

    expect(state.members).toHaveLength(0);
    expect(state.audioProducers).toStrictEqual({});
    expect(state.videoProducers).toStrictEqual({});
    expect(state.volumes).toStrictEqual({});
    expect(state.soundjacks).toStrictEqual({});

    act(() => {
        dispatch({
            type: ACTION_TYPES.ADD_MEMBER,
            event: {
                uid: 123,
                member: {
                    displayName: "name",
                    online: true
                }
            }
        })
    });
    [state, dispatch] = result.current;

    expect(state.members).toHaveLength(1);
})
