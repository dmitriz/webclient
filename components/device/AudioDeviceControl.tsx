import {IDevice} from "../../lib/useDigitalStage/base";
import React, {useState} from "react";
import {Modal, ModalBody, ModalHeader} from "baseui/modal";
import {Button} from "baseui/button";
import {SimpleSelect} from "../theme/Select";

export default (props: {
    device: IDevice
}) => {
    const [isOpen, setOpen] = useState<boolean>();

    return (
        <>
            <Button
                onClick={() => setOpen(true)}
                kind="minimal"
                size="compact"
            >
                <img src="settings-white-18dp.svg"/>
            </Button>
            <Modal
                overrides={{
                    Root: {
                        style: {
                            zIndex: 4000
                        }
                    }
                }}
                closeable
                autoFocus
                isOpen={isOpen}
                onClose={() => setOpen(false)}
            >
                <ModalHeader>
                    {props.device.caption} Settings
                </ModalHeader>
                <ModalBody>
                    <SimpleSelect
                        values={props.device.audioDevices}
                        index={props.device.inputAudioDevice}
                        onChange={id => props.device.setAudioInputDevice(id)}
                    />
                    <SimpleSelect
                        values={props.device.audioDevices}
                        index={props.device.outputAudioDevice}
                        onChange={id => props.device.setAudioOutputDevice(id)}
                    />
                </ModalBody>
            </Modal>
        </>
    );
}
