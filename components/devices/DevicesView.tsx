import useDevices from "../../lib/digitalstage/useDevices";
import {StyledBodyCell, StyledHeadCell, StyledTable} from 'baseui/table-grid';
import React from "react";
import {Checkbox, STYLE_TYPE} from "baseui/checkbox";
import {useStyletron} from "baseui";
import {AbstractDevice} from "digitalstage-client-base";
import {Button} from "baseui/button";
import {Modal, ModalBody, ModalHeader} from "baseui/modal";

const DeviceRow = (props: {
    device: AbstractDevice
}) => {
    const [isOpen, setIsOpen] = React.useState<boolean>(false);

    console.log(props.device);

    return (
        <>
            <StyledBodyCell>{props.device.name}</StyledBodyCell>
            <StyledBodyCell>{props.device.caption}</StyledBodyCell>
            <StyledBodyCell>
                <Checkbox
                    checked={props.device.sendVideo}
                    disabled={!props.device.canVideo}
                    onChange={e => props.device.setSendVideo(e.currentTarget.checked)}
                    checkmarkType={STYLE_TYPE.toggle_round}
                />
            </StyledBodyCell>
            <StyledBodyCell>
                <Checkbox
                    checked={props.device.sendAudio}
                    disabled={!props.device.canAudio}
                    onChange={e => props.device.setSendAudio(e.currentTarget.checked)}
                    checkmarkType={STYLE_TYPE.toggle_round}
                />
            </StyledBodyCell>
            <StyledBodyCell>
                <Checkbox
                    checked={props.device.receiveVideo}
                    disabled={!props.device.canVideo}
                    onChange={e => props.device.setReceiveVideo(e.currentTarget.checked)}
                    checkmarkType={STYLE_TYPE.toggle_round}
                />
            </StyledBodyCell>
            <StyledBodyCell>
                <Checkbox
                    checked={props.device.receiveAudio}
                    disabled={!props.device.canAudio}
                    onChange={e => props.device.setReceiveAudio(e.currentTarget.checked)}
                    checkmarkType={STYLE_TYPE.toggle_round}
                />
            </StyledBodyCell>
            <StyledBodyCell>
                <Button onClick={() => setIsOpen(true)}>Settings</Button>
                <Modal onClose={() => setIsOpen(false)} isOpen={isOpen}
                       overrides={{
                           Root: {
                               style: {
                                   zIndex: 9999
                               }
                           }
                       }}>
                    <ModalHeader>{props.device.name} Settings</ModalHeader>
                    <ModalBody>
                        {props.device.audioDevices && props.device.audioDevices.map((d: string) => <span>{d}</span>)}
                        Input {props.device.inputAudioDevice}
                        Output {props.device.outputAudioDevice}
                    </ModalBody>
                </Modal>
            </StyledBodyCell>
        </>);
}

export default () => {
    const devices = useDevices();
    const [css] = useStyletron();

    return (
        <div
            className={css({
                gridColumn: 'span 7',
                padding: '22px 14px',
            })}
        >
            <StyledTable $gridTemplateColumns="max-content auto auto auto auto auto auto">
                <StyledHeadCell $sticky={false}>Type</StyledHeadCell>
                <StyledHeadCell $sticky={false}>Caption</StyledHeadCell>
                <StyledHeadCell $sticky={false}>Send video</StyledHeadCell>
                <StyledHeadCell $sticky={false}>Send audio</StyledHeadCell>
                <StyledHeadCell $sticky={false}>Receive video</StyledHeadCell>
                <StyledHeadCell $sticky={false}>Receive audio</StyledHeadCell>
                <StyledHeadCell $sticky={false}/>
                {devices.map((device: AbstractDevice) => <DeviceRow key={device.id} device={device}/>)}
            </StyledTable>
        </div>
    )
}
