import React from "react";
import {styled} from "styletron-react";
import {IMember} from "../../lib/useDigitalStage";

const Container = styled("div", {
    display: "flex",
    flexWrap: "wrap",
});

const Card = styled("div", {
    position: "relative",
    backgroundColor: "black",
    width: "50%",
});

const CardConstraint = styled("div", {
    position: "relative",
    width: "100%",
    paddingTop: "56.25%"

})

const CardContent = styled("div", {
    position: "absolute",
    width: "100%",
    height: "100%"

})

export default (props: {
    members?: IMember[]
}) => {

    return (
        <Container>
            {props.members && props.members.map(member => (
                <Card>
                    <CardConstraint/>
                    <CardContent>

                    </CardContent>
                </Card>
            ))}

        </Container>
    )
}
