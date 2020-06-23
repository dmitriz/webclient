import {StyledBodyCell, StyledHeadCell, StyledTable} from 'baseui/table-grid';
import React from "react";
import {Checkbox, STYLE_TYPE} from "baseui/checkbox";
import {useStyletron} from "baseui";
import {Button} from "baseui/button";
import {Modal, ModalBody, ModalHeader} from "baseui/modal";
import {IDevice} from "../../lib/digitalstage/base";
import {useStage} from "../../lib/digitalstage/useStage";
import {useDarkModeSwitch} from "../../lib/useDarkModeSwitch";
import Select, {Option} from '../relaunch/components/Select';

const AudioDeviceSelector = (props: {
    device: IDevice
}) => {
    const [css] = useStyletron();
    const devices: Option[] = props.device.audioDevices.map((device: string, index: number) => ({
        value: device,
        id: index
    }));

    return (
        <div className={css({
            position: "relative"
        })}>
            <Select
                values={devices}
                value={props.device.inputAudioDevice && devices[props.device.inputAudioDevice]}
                onChange={(value) => {
                    if (value) {
                        props.device.setAudioInputDevice(value.id);
                    } else {
                        props.device.setAudioInputDevice(0);
                    }
                }}
            />
            <Select
                values={devices}
                value={props.device.outputAudioDevice && devices[props.device.outputAudioDevice]}
                onChange={(value) => {
                    if (value) {
                        props.device.setAudioOutputDevice(value.id);
                    } else {
                        props.device.setAudioOutputDevice(0);
                    }
                }}
            />
        </div>
    );
}

const DeviceRow = (props: {
    device: IDevice
}) => {
    const [isOpen, setIsOpen] = React.useState<boolean>(false);
    const {darkMode} = useDarkModeSwitch();

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
                <Button size="mini" kind="minimal" onClick={() => setIsOpen(true)}><img
                    src={darkMode ? "more_horiz-white-18dp.svg" : "more_horiz-black-18dp.svg"}/></Button>
                <Modal onClose={() => setIsOpen(false)} isOpen={isOpen}
                       unstable_ModalBackdropScroll={true}
                       overrides={{
                           Root: {
                               style: {
                                   zIndex: 9999
                               }
                           }
                       }}>
                    <ModalHeader>{props.device.name} Settings</ModalHeader>
                    <ModalBody>
                        <AudioDeviceSelector device={props.device}/>
                    </ModalBody>
                </Modal>
            </StyledBodyCell>
        </>);
}

export default () => {
    const {devices} = useStage();
    const [css] = useStyletron();
    const {darkMode} = useDarkModeSwitch();

    console.log(devices);

    return (
        <div
            className={css({
                gridColumn: 'span 7',
                padding: '22px 14px',
            })}
        >
            <StyledTable $gridTemplateColumns="max-content auto auto auto auto auto auto">
                <StyledHeadCell $sticky={true}/>
                <StyledHeadCell $sticky={true}><img
                    src={darkMode ? "toc-white-18dp.svg" : "toc-black-18dp.svg"}/></StyledHeadCell>
                <StyledHeadCell $sticky={true}><img
                    src={darkMode ? "videocam-white-18dp.svg" : "videocam-24px.svg"}/></StyledHeadCell>
                <StyledHeadCell className={css({justifyContent: "center"})} $sticky={true}><img
                    src={darkMode ? "mic-white-18dp.svg" : "mic-24px.svg"}/></StyledHeadCell>
                <StyledHeadCell className={css({justifyContent: "center"})} $sticky={true}><img
                    src={darkMode ? "live_tv-white-18dp.svg" : "live_tv-24px.svg"}/></StyledHeadCell>
                <StyledHeadCell className={css({justifyContent: "center"})} $sticky={true}><img
                    src={darkMode ? "volume_up-white-18dp.svg" : "volume_up-24px.svg"}/></StyledHeadCell>
                <StyledHeadCell $sticky={true}/>
                {devices.map((device: IDevice) => <DeviceRow key={device.id} device={device}/>)}
            </StyledTable>
        </div>
    )
}
