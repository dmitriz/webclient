import Link from "next/link";
import CenteredCard from "../components/theme/CenteredCard";
import LoginForm from "../components/account/LoginForm";
import Layout from "../components/Layout";
import {useRouter} from "next/router";

export default () => {
    const router = useRouter()
    const {forward} = router.query;

    const target: string | undefined = forward && !Array.isArray(forward) ? forward : undefined;

    return (
        <Layout>
            <CenteredCard>
                <h1>Beta Login</h1>
                <LoginForm targetUrl={target ? target : "/"}/>
                <p>
                    or <Link href={"/signup" + (target ? "?forward=" + target : "")}><a>sign up</a></Link>
                </p>
            </CenteredCard>
        </Layout>
    );
}
