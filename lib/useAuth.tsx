import React, {useEffect, useState} from "react";
import firebase from "firebase/app";
import "firebase/auth";
import cookie from 'js-cookie';
import {FIREBASE_CONFIG} from "../env";

if (!firebase.apps.length) {
    firebase.initializeApp(FIREBASE_CONFIG);
}

export interface AuthProps {
    user: firebase.User | null;
    loading: boolean;
}

const AuthContext = React.createContext(undefined);

export const useAuth = (): AuthProps => React.useContext<AuthProps>(AuthContext);

export const AuthContextProvider = (props: {
    children: React.ReactNode
}) => {
    const [user, setUser] = useState<firebase.User>(firebase.auth().currentUser);
    const [loading, setLoading] = useState<boolean>(!user);

    const handleChange = (user: firebase.User | null) => {
        setUser(user);
        setLoading(false);
        if (user) {
            user.getIdToken().then(
                (token: string) => {
                    cookie.set('token', token, {expires: 1});
                }
            );
        } else {
            cookie.remove('token');
        }
    };

    useEffect(() => {
        const unsubscribe: firebase.Unsubscribe = firebase.auth().onAuthStateChanged(handleChange);
        return () => unsubscribe();
    }, []);

    return (
        <AuthContext.Provider value={{
            user: user,
            loading: loading
        }}>
            {props.children}
        </AuthContext.Provider>
    );
};

export const withAuth = (ComposedComponent: any) => {
    const DecoratedComponent = (props: any) => {
        return (
            <AuthContext.Consumer>
                {(auth: AuthProps) => (
                    <ComposedComponent user={auth.user} loading={auth.loading}  {...props} />
                )}
            </AuthContext.Consumer>
        );
    };
    return DecoratedComponent;
};
