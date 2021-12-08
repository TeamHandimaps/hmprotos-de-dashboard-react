import React from "react";
import "./PageNotFound.scss";

/** Generic page to handle routes that do not exist. */
function PageNotFound() {
  return (
    <div className="page-not-found">
      <h1>Sorry, page not found!</h1>
    </div>
  );
}

export default PageNotFound;
