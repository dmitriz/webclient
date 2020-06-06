import {styled} from "baseui";
import React from "react";

const Input = styled("input", {
    height: '100%',
    borderRadius: '5px',
    backgroundColor: '#fcc',
    outline: 'none',
    WebkitAppearance: 'slider-vertical',
});

export default (props: {
    step: number;
    min: number;
    max: number;
    value: number;
    onChange?(value: number): void;
}) => {


    return (
        <>
            <Input type="range" aria-orientation="vertical" step={props.step * 100} min={props.min * 100}
                   max={props.max * 100}
                   value={props.value}
                   onChange={props.onChange ? (e) => props.onChange(parseInt(e.currentTarget.value) / 100) : undefined}/>
        </>
    )
}
