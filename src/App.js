import React, { useState } from "react";

import "./App.scss";

import PageLogin from "./components/PageLogin";
import PageHome from "./components/PageHome";
// import PageNotFound from "./components/PageNotFound";

/** Handles rendering the top level of the App. */
function App() {
  const [auth, setAuth] = useState(false); // TODO: convert to some kind of auth context to use in the app overall?

  /** Handlers */
  const handleLogOut = () => {
    console.log("On logout?");
    setAuth(false);
  };

  const handleLogInCallback = (creds) => {
    setAuth(true);
  };

  /** Render */
  return (
    <div className="App">
      {auth ? <PageHome onLogout={handleLogOut} /> : <PageLogin onLoginCallback={handleLogInCallback} />}
    </div>
  );
}

export default App;
