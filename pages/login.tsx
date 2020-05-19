import LoginForm from "../components/LoginForm";
import Link from "next/link";
import Layout from "../components/ui/Layout";

export default () => {

    return (
        <Layout>
            <h1>Beta Login</h1>
            <LoginForm targetUrl="/"/>
            <p>
                or <Link href="/signup"><a>sign up</a></Link>
            </p>
        </Layout>
    );
}
