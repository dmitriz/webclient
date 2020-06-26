import React from "react";

export interface Option {
    id: number;
    value: string;
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
                <option key={value.id} value={value.id}>{value.value}</option>
            ))}
        </select>
    )
}
