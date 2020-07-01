import React, {useEffect, useState} from "react";
import {styled} from "styletron-react";
import {IMember} from "../../lib/useDigitalStage";
import {LabelMedium} from "baseui/typography";
import {FlexGrid, FlexGridItem} from "baseui/flex-grid";
import AudioMixer from "../audio/AudioMixer";
import CanvasPlayerV2 from "../video/CanvasPlayerV2";
import {useStyletron} from "baseui";

const Card = styled("div", {
    position: "relative",
    backgroundColor: "black",
});

const CardConstraint = styled("div", {
    position: "relative",
    width: "100%",
    paddingTop: "75%"

})

const CardContent = styled("div", {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%"
})

const SoundjackLogo = styled("img", {
    position: "absolute",
    width: "48px",
    height: "48px",
    top: 0,
    right: 0
});

const PoweredBySoundjack = styled("div", {
    position: "absolute",
    width: "100%",
    left: 0,
    right: 0,
    top: "30px"
})

export default (props: {
    members?: IMember[]
}) => {
    const [numDesktopCols, setNumDesktopCols] = useState<number>(1);
    const [css] = useStyletron();

    useEffect(() => {
        if (props.members && props.members.length <= 1) {
            setNumDesktopCols(1);
        } else {
            if (props.members.length > 4) {
                setNumDesktopCols(4)
            } else {
                setNumDesktopCols(2)
            }
        }
    }, [props.members])

    return (
        <>
            <FlexGrid
                width="100%"
                flexGridColumnCount={[
                    1,
                    props.members.length > 1 ? 2 : 1,
                    props.members.length > 1 ? 2 : 1,
                    numDesktopCols
                ]}
                flexGridColumnGap="scale800"
                flexGridRowGap="scale800"
            >
                {props.members && props.members.map(member => (
                    <FlexGridItem key={member.uid}>
                        <Card>
                            <CardConstraint/>
                            <CardContent>
                                {member.soundjacks.length > 0 && (
                                    <>
                                        <SoundjackLogo src={"soundjack.png"}/>
                                        <PoweredBySoundjack>
                                            <LabelMedium>
                                                Powered by soundjack.eu
                                            </LabelMedium>
                                        </PoweredBySoundjack>
                                    </>
                                )}
                                <div className={css({
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: "100%",
                                    zIndex: 2
                                })}>
                                    <LabelMedium $style={{
                                        textShadow: "rgb(0, 0, 0) 0px 0px 4px"
                                    }}>
                                        {member.name}
                                    </LabelMedium>
                                </div>
                                <CanvasPlayerV2
                                    className={css({
                                        position: "absolute",
                                        top: 0,
                                        left: 0,
                                        width: "100%",
                                        height: "100%",
                                        zIndex: 1
                                    })}
                                    videoProducers={member.videoProducers}/>
                                <AudioMixer member={member}/>
                            </CardContent>
                        </Card>
                    </FlexGridItem>
                ))}
            </FlexGrid>

        </>
    )
}
