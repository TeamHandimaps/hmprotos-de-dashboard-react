import React, { useState } from "react";
import axios from "axios";
import Queries from "../model/OpenDentalQueries";
import "./NavOpenDental.scss";

// helper methods
/**
 * Helper method to run data through an endpoint (and request type) via a defacto private-proxy.
 *
 * @param {*} endpoint Endpoint to request at.
 * @param {*} data The data to include in the body of the request.
 * @param {*} type The type of request (GET, POST, PUT, etc)
 * @returns A promise that will return either an error object or the response object.
 */
const runThruProxy = async (endpoint, data, type) => {
  console.log("Running through proxy service!");
  // this is ALWAYS the proxy url for the time being
  // TODO: Put this somewhere else ? .env ?
  const proxyurl = "https://hm-protos-de-odi.herokuapp.com/odgeneric";

  return await axios
    .post(proxyurl, {
      od_method: type,
      od_endpoint: endpoint,
      od_data: data,
    })
    .then((response) => response.data);
};

/**
 * Helper method to run data normally through the API via the client using axios.
 * 
 * @param {*} credentials The credentials to use to run the API.
 * @param {*} endpoint The endpoint to request at.
 * @param {*} type The type of request to send.
 * @param {*} data The data to send in the body of the request.
 * @returns 
 */
const runApi = async (credentials, endpoint, type = "GET", data) => {
  const { baseurl, customerkey, developerkey } = credentials;

  return await axios({
    method: type.toLowerCase(),
    url: `${baseurl}` + endpoint,
    data: data || null,
    headers: {
      Authorization: `ODFHIR ${developerkey}/${customerkey}`,
    },
  });
};

/** Handles rendering the top level "Open Dental" page in the navigation. */
function NavOpenDental() {
  const [loading, setLoading] = useState(null);
  const [response, setResponse] = useState("");
  const [credentials /*setCredentials*/] = useState({
    baseurl: "https://api.opendental.com/api/v1/",
    // commented out are the testing credentials for the respective keys
    customerkey: "VzkmZEaUWOjnQX2z", //'eQnXEknvdecrZ1EE',
    developerkey: "NFF6i0KrXrxDkZHt", // '6z8nAhQ7TlsNsuzY'
  });

  // Another layer of fgeneric api handlers
  /** This will run the specified query (via proxy). */
  const runQuery = async (query) => {
    setLoading(true);
    runThruProxy("queries/ShortQuery", { SqlCommand: query }, "PUT")
      .then((res) => {
        setResponse(JSON.stringify(res, null, 4));
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error running queries/ShortQuery", err);
      });
  };

  /** This will run any endpoint-requestType-data combination through the proxy. */
  const runViaProxy = async (endpoint, type, data) => {
    setLoading(true);
    runThruProxy(endpoint, data, type)
      .then((res) => {
        setResponse(JSON.stringify(res, null, 4));
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error running endpoint: /" + endpoint, err);
      });
  };

  /** This will run any endpoint-requestType-data combination through axios. */
  const runRegular = async (endpoint, type, data) => {
    setLoading(true);
    runApi(credentials, endpoint, type, data)
      .then((res) => {
        setResponse(JSON.stringify(res, null, 4));
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error running (reg) endpoint: /" + endpoint, err);
      });
  };

  // actual handlers
  /** Handler for running patients retrieval */
  const handleGetAllPatients = (evt) => {
    runRegular("patients?Offset=0", "GET", {});
  };
  /** Handler for retrieveing insurance plans */
  const handleGetAllInsurancePlans = (evt) => {
    runQuery(Queries.GrabAllInsurancePlans);
  };
  /** Handler for retrieving insurance plan - subscriber links.  */
  const handleGetAllInsuranceSubscriberLinks = (evt) => {
    runQuery(Queries.GrabAllInsuranceSubscriberLinks);
  };
  /** Handler for retrieving patient - subscriber - insurance plan links. */
  const handleGetAllPatientSubscriberLinks = (evt) => {
    runQuery(Queries.GrabAllPatientSubscriberLinks);
  };

  /** Handler for retrieving all insurance adjustments for a specified patient. TODO: Add in patient specification here and in model code. */
  const handleGetCurrentInsuranceAdjustmentsForPatient = (evt) => {
    runQuery(Queries.GrabAllInsuranceForPatient);
  };
  /** Handler for retrieving all patient-subscriber-insurance plan links for a specified patient. TODO: Add in patient specification here and in model code. */
  const handleGetCurrentPatientPlansForPatient = (evt) => {
    runQuery(Queries.GrabAllPatientPlansForPatient);
  };
  /** Handler for retrieving all insurance plans linked to a specified patient. TODO: Add in patient specification here and in model code. */
  const handleGetCurrentInsurancePlansForPatient = (evt) => {
    runQuery(Queries.GrabAllInsurancePlansForPatient);
  };

  /** Handler for creating an insurance plan - subscriber link. */
  const handleImage4CreateNewInsuranceSubscriberLink = (evt) => {
    runViaProxy("inssubs", "POST", {
      PlanNum: 9,
      Subscriber: 11,
      DateEffective: "2022-01-31",
      DateTerm: "2022-12-31",
      SubscriberID: "1234567",
      BenefitNotes: "API Created Benefit Notes",
    });
  };
  /** Handler for creating a patient-subscriber-insurance plan link. */
  const handleImage4CreateNewPatientSubscriberLink = (evt) => {
    runViaProxy("patplans", "POST", {
      PatNum: "11",
      Ordinal: 2,
      Relationship: "Self",
      InsSubNum: 6,
    });
  };

  /** Handler for creating a notice of insurance verification for a patient. */
  const handleImage4CreateNewBenefitsVerification = (evt) => {
    runViaProxy("insverifies", "PUT", {
      DateLastVerified: "2021-12-06",
      VerifyType: "PatientEnrollment",
      FKey: 14,
      // "DefNum": 721,
    });
  };

  /** Handler for creating a new insurance adjustment for a patient. */
  const handleImage5CreateNewInsuranceAdjustment = (evt) => {
    runViaProxy("claimprocs/InsAdjust", "PUT", {
      PatPlanNum: 14,
      date: "2021-12-06",
      insUsed: 123,
      // USE ONE OR THE OTHER
      // deductibleUsed: 45,
    });
  };

  // RENDER
  return (
    <div className='comp-open-dental'>
      <div className='demo-instructions'>
        <h1>Open Dental Flow</h1>

        <h2>Provide Credentials</h2>
        <form className='interaction-block'>
          <label>
            Base URL (static? probably?)
            <input disabled value={credentials.baseurl} />
          </label>
          <label>
            Customer API Key (generated via Developer Portal, attached within OpenDental)
            <input disabled value={credentials.customerkey} />
          </label>
          <label>
            Developer API Key (developer only)
            <input disabled value={credentials.developerkey} />
          </label>
        </form>

        <h2>Insurance Plan Data - Create/Modify/Delete (Images #1, #2, #3)</h2>
        <p className='impossible'>Currently Impossible with OpenDental's API</p>

        <h2>Insurance Plan Data - Read (Images #1, #2, #3)</h2>
        <form className='interaction-block'>
          <h3>Existing Insurance Plans (For Insurance Benefit Verification)</h3>
          <button type='button' onClick={handleGetAllInsurancePlans}>
            Get Current Insurance Plans
          </button>
        </form>

        <h2>Link Subscriber To Plan (Image #4)</h2>
        <p>Possible!</p>
        <form className='interaction-block'>
          <h3>Get Current Patients (Potential Subscribers)</h3>
          <button type='button' onClick={handleGetAllPatients}>
            Get All Patients
          </button>
          <h3>Get Current Insurance Plans</h3>
          <button type='button' onClick={handleGetAllInsurancePlans}>
            Get All Insurance Plans
          </button>

          <label>
            Patient Num (Subscriber)
            <input disabled value='11' />
          </label>

          <label>
            Patient Plan Num
            <input disabled value='9' />
          </label>

          <h3>Create Subscriber-Plan Link</h3>
          <button type='button' onClick={handleImage4CreateNewInsuranceSubscriberLink}>
            Create Subscriber-Plan Link
          </button>

          <h4>See Links</h4>
          <button type='button' onClick={handleGetAllInsuranceSubscriberLinks}>
            Get All Insurance Plan - Subscriber Links
          </button>
        </form>

        <h2>Link Patient To Subscriber (Image #4 - Implied)</h2>
        <p>Possible!</p>
        <form className='interaction-block'>
          <h3>Get Current Patients</h3>
          <button type='button' onClick={handleGetAllPatients}>
            Get All Patients
          </button>

          <h3>Get Current Insurance-Subscriber Links</h3>
          <button type='button' onClick={handleGetAllInsuranceSubscriberLinks}>
            Get All InsSubs
          </button>

          <label>
            Patient Num (Patient)
            <input disabled value='11' />
          </label>

          <label>
            Insurance-Subscriber Num (Subscriber)
            <input disabled value='11' />
          </label>

          <h3>Create Patient-Subscriber Link</h3>
          <button type='button' onClick={handleImage4CreateNewPatientSubscriberLink}>
            Create Patient-Subscriber Link
          </button>

          <h4>See Links</h4>
          <button type='button' onClick={handleGetAllPatientSubscriberLinks}>
            Get All Patient - Subscriber Links
          </button>
        </form>

        <h2>Add Subscriber Notes (Image #4)</h2>
        <p className='impossible'>Currently Impossible with OpenDental's API</p>

        <h2>Post Notice of Benefits Verification (Image #4)</h2>
        <form className='interaction-block'>
          <h3>Existing Patient Plans (For Patient Enrollment Verification)</h3>
          <button type='button' onClick={handleGetCurrentPatientPlansForPatient}>
            Get Current Patient Plans
          </button>
          <h3>Existing Insurance Plans (For Insurance Benefit Verification)</h3>
          <button type='button' onClick={handleGetCurrentInsurancePlansForPatient}>
            Get Current Insurance Plans
          </button>

          <label>
            Date Last Verified
            <input disabled type='date' value='2021-12-06' />
          </label>

          <label>
            Verify Type (PatientEnrollment or InsuranceBenefit)
            <input disabled value='PatientEnrollment' />
          </label>

          <label>
            PatPlanNum OR InsPlanNum (depends on PatientEnrollment or InsuranceBenefit verify type respectively)
            <input disabled value='14' />
          </label>

          <label>
            Def Num (optional, see documentation)
            <input disabled value='N/A' />
          </label>

          <h3>Create Notice of Benefits Verification</h3>
          <button type='button' onClick={handleImage4CreateNewBenefitsVerification}>
            Create Verification Notice
          </button>
        </form>

        <h2>Create Insurance Adjustments (Image #5)</h2>
        <p>Possible!</p>
        <form className='interaction-block'>
          <label>
            Patient Num Being Used
            <input disabled value='11' />
          </label>

          <h3>Existing Insurance Adjustments (Do we need to create an adjustment?)</h3>
          <button type='button' onClick={handleGetCurrentInsuranceAdjustmentsForPatient}>
            Get Current Insurance Adjustments For Patient
          </button>

          <h3>Existing Patient Plans (Will need for adjustment creation)</h3>
          <button type='button' onClick={handleGetCurrentPatientPlansForPatient}>
            Get Current Patient Plans For Patient
          </button>

          <h3>Create New Insurance Adjustment</h3>
          <label>
            Patient Plan
            <input disabled value='14' />
          </label>
          <label>
            Date
            <input disabled type='date' value='2021-12-06' />
          </label>
          <label>
            Insurance Used ($)
            <input disabled type='number' value='123' />
          </label>
          <label>
            Deductible Used ($) (Use this OR Insurance Use Field)
            <input disabled type='number' value='45' />
          </label>
          <button type='button' onClick={handleImage5CreateNewInsuranceAdjustment}>
            Create Insurance Adjustment
          </button>
        </form>
        <div id='spacer' />
      </div>

      <div className={loading || loading == null ? "response-box loading" : "response-box"}>
        {loading == null ? "" : loading ? "Loading..." : <pre>{response}</pre>}
      </div>
    </div>
  );
}

export default NavOpenDental;
