import SignUpForm from "../components/SignUpForm";
import Layout from "../components/ui/Layout";
import CenteredCard from "../components/ui/CenteredCard";

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
