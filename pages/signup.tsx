import SignUpForm from "../components/user/SignUpForm";
import Layout from "../components/theme/Layout";
import CenteredCard from "../components/theme/CenteredCard";

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
