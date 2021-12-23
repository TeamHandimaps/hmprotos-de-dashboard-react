import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Sidebar.scss";

const NAV_PATHS_MAP = {
  Verify: "verify",
  Patients: "patients",
  Providers: "providers",
  "Open Dental": "opendental",
  "Open Dental v2": "opendentalv2"
};
/** Sidebar is a cruical part of navigation flow. Allows for callbacks on nav changes AND auth changes. */
function Sidebar() {
  const navigate = useNavigate();
  const auth = useAuth();
  
  /** Map nav paths to buttons. */
  const navButtons = Object.keys(NAV_PATHS_MAP).map((val) => (
    <button className="nav" key={val} onClick={() => navigate(NAV_PATHS_MAP[val])}>
      {val}
    </button>
  ));

  /** Render. */
  return (
    <div className="comp-sidebar">
      {navButtons}
      <div id="spacer" />
      <button onClick={() => auth.logout()}>Log Out</button>
    </div>
  );
}

export default Sidebar;
