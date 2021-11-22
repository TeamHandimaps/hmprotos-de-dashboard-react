import React, { useEffect, useState } from "react";
import "./CompResponseDataRawOverlay.scss";

import { default as parseResponseData} from './UtilParseResponseData.js'

function CompResponseDataRawOverlay({ response, onClose = () => {} }) {
  const [content, setContent] = useState(null);

  console.log("USing response data", response)

  useEffect(() => {
    const message = (response && response.val && response.val.APIResponseMessage) || ''
    if (message !== 'Processed') { return }    
    parseResponseData(response, (contentToSet) => {
      setContent(contentToSet);
    });
  }, [response]);

  return (
    <div className='comp-response-data-raw-overlay'>
      <div className='overlay-container'>
        <div className='header'>
          <button onClick={onClose}>Close Data</button>
        </div>
        <div className='content'>{content}</div>
      </div>
    </div>
  );
}

export default CompResponseDataRawOverlay;
