import {useRouter} from 'next/router'
import useDigitalStage from "../../lib/useDigitalStage";
import Loading from '../../components/theme/Loading';
import {useEffect} from "react";

export default () => {
    const router = useRouter()
    const {id, password} = router.query;
    const {loading, join, user, error} = useDigitalStage();

    useEffect(() => {
        if (!loading && join && id) {
            console.log("Joining stage  " + id + " with password" + password);
            join(id as string, password ? password as string : "");
        }
    }, [loading, join, id, password]);

    if (loading) {
        return <Loading><h1>Loading...</h1></Loading>
    }

    if (!user) {
        router.push("/login");
    }

    console.log(error);

    return (
        <div>
            {error && (
                <h1>{error.message}</h1>
            )}
        </div>
    )
}
