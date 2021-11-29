import React, { } from "react";
import "./CompResponseDataRawOverlay.scss";

import RawResponseCustomDataTable from './UtilRawResponseCustomDataTable.js'

function CompResponseDataRawOverlay({ response, onClose = () => {} }) {
  console.log("LOG-Overlay", "Using response data", response)
  return (
    <div className='comp-response-data-raw-overlay'>
      <div className='overlay-container'>
        <div className='header'>
          <button onClick={onClose}>Close Data</button>
        </div>
        <div className='content'><RawResponseCustomDataTable response={response}/></div>
      </div>
    </div>
  );
}

export default CompResponseDataRawOverlay;
