import { createContext, useMemo, useState, useContext } from "react";

/** The AuthContext to use by default. */
const AuthContext = createContext({
    user: null,
    loading: false,
    error: null,
    login: creds => {},
    logout: () => {},
})


/** Provider to use to wrap the app in. */
export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(false)

    /**
     * Context function to handle processing a login-like update for the context.
     * 
     * @param {object}
     */
    function login({ user, pass }) { 
        setLoading(true)
        setTimeout(() => {
            setUser({
                username: user,
                token: 'token_' + pass,
                office: 'office_00'
            })
            setLoading(false)
        }, 250);
    }
    function logout() {
        setUser(null)
    }

    const authInterface = useMemo(
        () => ({
            user,
            loading,
            login,
            logout,
        }),
        [user, loading]
    );

    return <AuthContext.Provider value={authInterface}>
        {children}
    </AuthContext.Provider>
}

/** Hook for using context in a functional component. */
export function useAuth() {
    return useContext(AuthContext)
}

/** HOC to allow any class component to consume auth context. */
export function withAuth(Component) {
    return function(props) { 
        return <AuthContext.Consumer>
            {value => <Component {...props} auth={value} />}
        </AuthContext.Consumer>
    }
}