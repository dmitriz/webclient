import LoginForm from "../components/user/LoginForm";
import Link from "next/link";
import Layout from "../components/theme/Layout";
import CenteredCard from "../components/theme/CenteredCard";

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
