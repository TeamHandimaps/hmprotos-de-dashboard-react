import React from "react";

import "./App.scss";

import PageLogin from "./components/PageLogin";
import PageHome from "./components/PageHome";
import PageNotFound from "./components/PageNotFound";
import { useAuth } from "./context/AuthContext";

import NavVerify from "./components/NavVerify";
import NavPatients from "./components/NavPatients";
import NavProviders from "./components/NavProviders";
import NavOpenDental from "./components/NavOpenDental";

import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import CompPatientInfoDetail from "./components/CompPatientInfoDetail";
import NavOpenDentalEnhanced from "./components/NavOpenDentalEnhanced";

/**
 * Login Outlet, which handles displaying an outlet when we DON'T have auth,
 * otherwise will navigate/redirect back to root.
 */
function LoginOutlet() {
  const auth = useAuth();
  return !auth.user ? <Outlet /> : <Navigate to="/" />;
}

/**
 * Private Outlet, which handles displaying an outlet when we DO have auth,
 * otherwise will navigate/redirect to login.
 */
function PrivateOutlet() {
  const auth = useAuth();
  return auth.user ? <Outlet /> : <Navigate to="login" />;
}

/**
 * Handles rendering the top level of the App.
 */
function App() {
  /** Render */
  return (
    <div className="App">
      <Routes>
        <Route path="login" element={<LoginOutlet />}>
          <Route path="" element={<PageLogin />} />
        </Route>

        <Route path="/" element={<PrivateOutlet />}>
          <Route path="/" element={<PageHome />}>
            <Route path="/" element={<Navigate to="/verify" />} />
            <Route path="verify" element={<NavVerify />} />
            <Route path="patients" element={<NavPatients />} />
            <Route path="patients/:id" element={<CompPatientInfoDetail />} />
            <Route path="providers" element={<NavProviders />} />
            <Route path="opendental" element={<NavOpenDental />} />
            <Route path="opendentalv2" element={<NavOpenDentalEnhanced/>}/>
          </Route>
        </Route>

        <Route path="/:rest/*" element={<PageNotFound />} />
      </Routes>
    </div>
  );
}

export default App;
