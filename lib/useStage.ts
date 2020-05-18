import firebase from "firebase/app";
import "firebase/database";
import {useCallback, useState} from "react";

export default (user: firebase.User) => {
    const [stage, setStage] = useState();

    const create = useCallback((name: string, password: string) => {

    }, []);

    const join = useCallback((stageId: string, password: string) => {

    }, []);

    return {
        stage,
        create,
        join
    }
};
