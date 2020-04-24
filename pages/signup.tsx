import SignUpForm from "../components/SignUpForm";
import Layout from "../components/ui/Layout";

export default () => {

    return (
        <Layout>
            <h1>Login</h1>
            <SignUpForm
                backLink="/"
                targetUrl="/"/>
        </Layout>
    );
}
