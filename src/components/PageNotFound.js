import React from "react";
import { Link } from "react-router-dom";
import "./PageNotFound.scss";

/** Generic page to handle routes that do not exist. */
function PageNotFound() {
  return (
    <div className="page-not-found">
      <h1>Sorry, page not found!</h1>
      <Link to='/'>Return To App</Link>
    </div>
  );
}

export default PageNotFound;
