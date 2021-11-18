import React, { useState } from "react";
import CompVerificationForm from "./CompVerificationForm";
import "./CompEligibilityVerification.scss";

import DentalAPI from "../model/DentalAPI";

function CompEligibilityVerification() {
  const [responseData, setResponseData] = useState({})
  
  const handleFormSubmit = data => {
    DentalAPI.getEligibility(data).then(res => {
      console.log("Setting response data!", res)
      setResponseData(res)
      return true
    }).catch(err => {
      console.error("Error getting Eligibility:", err)
      return false
    })

  }

  const responseHTML = responseData.DentalInfo || ''

  return (
    <div className='component-eligibility-verification'>
      <h1>Patient Eligibility Verification Form</h1>
      <CompVerificationForm onSubmit={handleFormSubmit} />
      <h2>Response Data Preview</h2>
      <div dangerouslySetInnerHTML={{ __html: responseHTML }} />
    </div>
  );
}

export default CompEligibilityVerification;
