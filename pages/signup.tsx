import CenteredCard from "../components/theme/CenteredCard";
import Layout from "../components/Layout";
import SignUpForm from "../components/account/SignUpForm";

export default () => {

    return (
        <Layout>
            <CenteredCard>
                <h1>Beta Sign up</h1>
                <SignUpForm
                    backLink="/login"
                    targetUrl="/"/>
            </CenteredCard>
        </Layout>
    );
}
