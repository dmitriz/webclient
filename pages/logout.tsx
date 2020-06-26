import React, {useEffect} from "react";
import Router from "next/router";
import firebase from "firebase/app";
import "firebase/auth"
import Loading from "../components/theme/Loading";
import {useAuth} from "../lib/useAuth";

export default () => {
    const {user} = useAuth();

    useEffect(() => {
        firebase.auth().signOut().then(
            () => Router.replace("/")
        )
    }, []);

    return (
        <Loading>
            <h1>
                Signing out..
            </h1>
        </Loading>
    );
}
