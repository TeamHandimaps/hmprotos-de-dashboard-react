import React, { useEffect, useState } from "react";
import CompVerificationForm from "./CompVerificationForm";
import "./NavVerify.scss";
import IFrame from './UtilReactIFrame.js';

import DentalAPI from "../model/DentalAPI";
import { getDatabase, onValue, ref } from "firebase/database";

function NavVerify({ officeid = "office_00"}) {
  const [providers, setProviders] = useState([])
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(false);
  const [responseData, setResponseData] = useState(null)
  
  useEffect(() => {
    const db = getDatabase()

    const providersRef = ref(db, `data/${officeid}/practices`)
    onValue(providersRef, (snap) => {
      let currentProviders = []
      snap.forEach(child => {
        currentProviders.push({
          key: child.key,
          val: child.val()
        })
      })
      setProviders(currentProviders)
    })

    const patientsRef = ref(db, `data/${officeid}/patients`)
    onValue(patientsRef, (snap) => {
      let currentPatients = []
      snap.forEach(child => {
        currentPatients.push({
          key: child.key,
          val: child.val()
        })
      })
      setPatients(currentPatients)
    })

  }, [officeid])

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
      <CompVerificationForm onSubmit={handleFormSubmit} loading={loading || providers.length === 0} patients={patients} providers={providers}/>
      <h2>Response Data Preview</h2>
      <div className="response-data-preview">{getResponseDataPreview() }</div>
    </div>
  );
}

export default NavVerify;
