import React, { useState } from "react";
import CompVerificationForm from "./CompVerificationForm";
import "./CompEligibilityVerification.scss";
import IFrame from './UtilReactIFrame.js';

import DentalAPI from "../model/DentalAPI";

function CompEligibilityVerification() {
  const [loading, setLoading] = useState(false);
  const [responseData, setResponseData] = useState(null)
  
  const handleFormSubmit = data => {
    setLoading(true)
    DentalAPI.getEligibility(data).then(res => {
      console.log("Setting response data!", res)
      setResponseData(res)
      return true
    }).catch(err => {
      console.error("Error getting Eligibility:", err)
      return false
    }).finally(() => {
      setLoading(false)
    })

  }


  const getResponseDataPreview = () => {
    if (loading) {
      return <p>Loading...</p>
    }

    if (!responseData) {
      return null
    }

    
    let content = null
    if (!responseData.DentalInfo) {
      content = '<div class="response-html-error">' + responseData.APIResponseMessage + '</div>'
    } else {
        content = responseData.DentalInfo || ''
    }

    return <>
      <IFrame content={content} wrap={!responseData.DentalInfo} />
    </>
  }

  return (
    <div className='component-eligibility-verification'>
      <h1>Patient Eligibility Verification Form</h1>
      <CompVerificationForm onSubmit={handleFormSubmit} loading={loading} />
      <h2>Response Data Preview</h2>
      <div className="response-data-preview">{getResponseDataPreview() }</div>
    </div>
  );
}

export default CompEligibilityVerification;
