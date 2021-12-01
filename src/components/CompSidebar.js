import React from "react";
import "./CompSidebar.scss";

const NAV_PATHS = [ "Verify", "Patients","Providers", "Open Dental"];

function CompSidebar({ onNav = () => {}, onLogout = () => {} }) {
  const navButtons = NAV_PATHS.map((val, ind) => (
    <button className="nav" key={val} onClick={() => onNav(ind)}>
      {val}
    </button>
  ));

  return (
    <div className="comp-sidebar">
      {navButtons}
      <div id="spacer" />
      <button onClick={onLogout}>Log Out</button>
    </div>
  );
}

export default CompSidebar;
