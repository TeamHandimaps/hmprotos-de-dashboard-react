import React, { useState } from "react";

import "./App.scss";

import PageLogin from "./components/PageLogin";
import PageHome from "./components/PageHome";
// import PageNotFound from "./components/PageNotFound";

function App() {
  const [auth, setAuth] = useState(false);

  const handleLogOut = () => {
    console.log("On logout?");
    setAuth(false);
  };

  const handleLogInCallback = (creds) => {
    setAuth(true);
  };

  return (
    <div className="App">
      {auth ? <PageHome onLogout={handleLogOut} /> : <PageLogin onLoginCallback={handleLogInCallback} />}
    </div>
  );
}

export default App;
