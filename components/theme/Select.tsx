import React, {useEffect, useState} from "react";
import {Select, Value} from "baseui/select";

export interface Option {
    id: number;
    label: string;
}

export default (props: {
    value?: Option;
    values: Option[];
    onChange?: (value: Option) => void
}) => {

    return (
        <select onChange={(e) => {
            if (props.onChange)
                props.onChange(props.values[e.currentTarget.selectedIndex])
        }} value={props.value && props.value.id}>
            {props.values.map((value) => (
                <option key={value.id} value={value.id}>{value.label}</option>
            ))}
        </select>
    )
}

export const SimpleSelect = (props: {
    index?: number;
    values: string[];
    onChange?: (index: number) => void
}) => {
    const [options, setOptions] = useState<Value>([]);
    const [value, setValue] = useState([]);

    useEffect(() => {
        const options: Value = props.values.map((value, index) => ({
            id: index,
            label: value
        }));
        setOptions(options);
        if (props.index && 0 < props.index && props.index < options.length) {
            setValue([options[props.index]]);
        } else {
            setValue([]);
        }

    }, [props.values, props.index])

    return (
        <Select
            overrides={{
                Root: {
                    style: {
                        position: "relative",
                        zIndex: 1000
                    }
                }
            }}
            options={options}
            value={value}
            onChange={params => {
                if (props.onChange && params.value[0]) {
                    props.onChange(params.value[0].id as number)
                }
            }}
        />
    )
}
