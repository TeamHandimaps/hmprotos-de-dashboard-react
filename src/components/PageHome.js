import React from "react";
import "./PageHome.scss";

import Sidebar from "./Sidebar";
import { Outlet } from "react-router-dom";

/** Handles the main part of the post-authenticated flow of the app. */
function PageHome() {
  /** Render. */
  return (
    <div className="page-home">
      <Sidebar />
      <div className="content-container">
        <Outlet />
      </div>
    </div>
  );
}

export default PageHome;
