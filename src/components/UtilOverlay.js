import React from "react";
import "./UtilOverlay.scss";

/** Component to display raw response data (read-only) as a collapsible-card-sectioned table-like format. */
function UtilOverlay({ children, onClose = () => {} }) {
  return (
    <div className="comp-response-data-raw-overlay">
      <div className="overlay-container">
        <div className="header">
          <button onClick={onClose}>Close Data</button>
        </div>
        <div className="content">{children}</div>
      </div>
    </div>
  );
}

export default UtilOverlay;
