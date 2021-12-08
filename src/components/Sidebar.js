import React from "react";
import "./Sidebar.scss";

const NAV_PATHS = [ "Verify", "Patients","Providers", "Open Dental"];

/** Sidebar is a cruical part of navigation flow. Allows for callbacks on nav changes AND auth changes. */
function Sidebar({ onNav = () => {}, onLogout = () => {} }) {
  /** Map nav paths to buttons. */
  const navButtons = NAV_PATHS.map((val, ind) => (
    <button className="nav" key={val} onClick={() => onNav(ind)}>
      {val}
    </button>
  ));

  /** Render. */
  return (
    <div className="comp-sidebar">
      {navButtons}
      <div id="spacer" />
      <button onClick={onLogout}>Log Out</button>
    </div>
  );
}

export default Sidebar;
