import React, { FunctionComponent } from 'react';

import './ColorPicker.css';

type ColorPickerProps = {
    id: string
    color: string,
    disabled?: boolean,
    onColorChange: (event: React.ChangeEvent<HTMLInputElement>) => void
}

const ColorPicker: FunctionComponent<ColorPickerProps> = (props: Readonly<ColorPickerProps>) => {
    const pickerRef: React.RefObject<HTMLDivElement> = React.createRef();
    const inputRef: React.RefObject<HTMLInputElement> = React.createRef();
    const openNativeInput = (): void => {
        if (!props.disabled)
            inputRef.current?.click();
    }
    const onChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
        event.persist();
        if (pickerRef.current && event.target.value) {
            const selectedColor = event.target.value || props.color;
            pickerRef.current.style.backgroundColor = selectedColor;
            props.onColorChange(event);
        }
    }
    return (
        <div
            className="color-picker-container"
            style={{ cursor: props.disabled ? 'not-allowed' : 'pointer' }}
        >
            <div
                style={{ backgroundColor: props.color }}
                className="color-picker"
                ref={pickerRef}
                onClick={openNativeInput}
            ></div>
            <input id={props.id} type="color" ref={inputRef} onChange={onChange} />
        </div>
    )
}

export default ColorPicker;
