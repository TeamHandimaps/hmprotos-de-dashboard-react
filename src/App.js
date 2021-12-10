import React from "react";

import "./App.scss";

import PageLogin from "./components/PageLogin";
import PageHome from "./components/PageHome";
import PageNotFound from './components/PageNotFound'
import { useAuth } from "./context/AuthContext";

/** Handles rendering the top level of the App. */
/**
 * 
 * @returns 
 */
function App() {
  const auth = useAuth()

  if (window.location.pathname.length > 1) {
    return <PageNotFound />
  }
  

  /** Render */
  return (
    <div className="App">
        {auth.user ? <PageHome/> : <PageLogin/>}
    </div>
  );
}

export default App;
