import React from "react";
import "./PageHome.scss";

import Sidebar from "./CompSidebar";
import EligibilityVerification from "./CompEligibilityVerification";
import VerificationList from "./CompVerificationList";
import Info from "./CompInfo";
import CompOpenDental from "./CompOpenDental"

const NAV_PAGES = [ EligibilityVerification, VerificationList, Info, CompOpenDental];

function PageHome({ onLogout = () => {} }) {
  const [nav, setNav] = React.useState(0);

  const handleNav = (navInd) => {
    setNav(navInd);
  };

  const NavPage = NAV_PAGES[nav];

  return (
    <div className="page-home">
      < Sidebar onNav={handleNav} onLogout={onLogout} />
      <div className="content-container">
        <NavPage />
      </div>
    </div>
  );
}

export default PageHome;
