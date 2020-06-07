
import useDevices from "../../lib/digitalstage/useDevices";
import {StyledBodyCell, StyledHeadCell, StyledTable} from 'baseui/table-grid';
import React from "react";
import {Checkbox, STYLE_TYPE} from "baseui/checkbox";
import {useStyletron} from "baseui";
import AbstractDevice from "../../lib/digitalstage/device/AbstractDevice";

export default () => {
    const devices = useDevices();
    const [css] = useStyletron();

    return (
        <div
            className={css({
                gridColumn: 'span 6',
                padding: '22px 14px',
            })}
        >
            <StyledTable $gridTemplateColumns="max-content auto auto auto auto auto">
                <StyledHeadCell $sticky={false}>Type</StyledHeadCell>
                <StyledHeadCell $sticky={false}>Caption</StyledHeadCell>
                <StyledHeadCell $sticky={false}>Send video</StyledHeadCell>
                <StyledHeadCell $sticky={false}>Send audio</StyledHeadCell>
                <StyledHeadCell $sticky={false}>Receive video</StyledHeadCell>
                <StyledHeadCell $sticky={false}>Receive audio</StyledHeadCell>
                {devices.map((device: AbstractDevice) => (
                    <>
                        <StyledBodyCell>{device.name}</StyledBodyCell>
                        <StyledBodyCell>{device.caption}</StyledBodyCell>
                        <StyledBodyCell>
                            <Checkbox
                                checked={device.sendVideo}
                                disabled={!device.canVideo}
                                onChange={e => device.setSendVideo(e.currentTarget.checked)}
                                checkmarkType={STYLE_TYPE.toggle_round}
                            />
                        </StyledBodyCell>
                        <StyledBodyCell>
                            <Checkbox
                                checked={device.sendAudio}
                                disabled={!device.canAudio}
                                onChange={e => device.setSendAudio(e.currentTarget.checked)}
                                checkmarkType={STYLE_TYPE.toggle_round}
                            />
                        </StyledBodyCell>
                        <StyledBodyCell>
                            <Checkbox
                                checked={device.receiveVideo}
                                disabled={!device.canVideo}
                                onChange={e => device.setReceiveVideo(e.currentTarget.checked)}
                                checkmarkType={STYLE_TYPE.toggle_round}
                            />
                        </StyledBodyCell>
                        <StyledBodyCell>
                            <Checkbox
                                checked={device.receiveAudio}
                                disabled={!device.canAudio}
                                onChange={e => device.setReceiveAudio(e.currentTarget.checked)}
                                checkmarkType={STYLE_TYPE.toggle_round}
                            />
                        </StyledBodyCell>
                    </>
                ))}
            </StyledTable>
        </div>
    )
}
