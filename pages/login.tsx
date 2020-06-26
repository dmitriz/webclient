import Link from "next/link";
import CenteredCard from "../components/theme/CenteredCard";
import LoginForm from "../components/account/LoginForm";
import Layout from "../components/Layout";

export default () => {

    return (
        <Layout>
            <CenteredCard>
                <h1>Beta Login</h1>
                <LoginForm targetUrl="/"/>
                <p>
                    or <Link href="/signup"><a>sign up</a></Link>
                </p>
            </CenteredCard>
        </Layout>
    );
}
