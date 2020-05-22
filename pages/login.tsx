import LoginForm from "../components/LoginForm";
import Link from "next/link";
import Layout from "../components/ui/Layout";
import CenteredCard from "../components/ui/CenteredCard";

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
