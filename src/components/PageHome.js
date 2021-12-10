import React from "react";
import "./PageHome.scss";

import Sidebar from "./Sidebar";
import EligibilityVerification from "./NavVerify";
import VerificationList from "./NavPatients";
import Info from "./NavProviders";
import CompOpenDentalFlow from "./NavOpenDental";

const NAV_PAGES = [EligibilityVerification, VerificationList, Info, CompOpenDentalFlow]; // TODO: Move to its own model class to define navigation throughout the app.

/** Handles the main part of the post-authenticated flow of the app. */
function PageHome() {
  const [nav, setNav] = React.useState(0);

  /** Nav handler. */
  const handleNav = (navInd) => {
    setNav(navInd);
  };

  /** Current nav page class to render. */
  const NavPage = NAV_PAGES[nav];

  /** Render. */
  return (
    <div className="page-home">
      <Sidebar onNav={handleNav} />
      <div className="content-container">
        <NavPage />
      </div>
    </div>
  );
}

export default PageHome;
