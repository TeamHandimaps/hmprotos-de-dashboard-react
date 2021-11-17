import React from "react";
import "./PageHome.scss";

import CompSidebar from "./CompSidebar";
import VerificationForm from "./CompVerificationForm";
import VerificationList from "./CompVerificationList";
import Info from "./CompInfo";

const NAV_PAGES = [ VerificationForm, VerificationList, Info];

function PageHome({ onLogout = () => {} }) {
  const [nav, setNav] = React.useState(0);

  const handleNav = (navInd) => {
    setNav(navInd);
  };

  const NavPage = NAV_PAGES[nav];

  return (
    <div className="page-home">
      <CompSidebar onNav={handleNav} onLogout={onLogout} />
      <div className="content-container">
        <NavPage />
      </div>
    </div>
  );
}

export default PageHome;
