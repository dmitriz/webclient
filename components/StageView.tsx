import {Stage} from "../lib/digitalstage/model";
import Layout from "./theme/Layout";

export default (props: {
    stage: Stage
}) => {

    return (
        <Layout>
            <h1>{props.stage.name}</h1>
            <p>
                {Object.keys(props.stage.participants).length} Participants
            </p>
        </Layout>
    )
}
