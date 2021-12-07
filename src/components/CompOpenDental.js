import React, { useState } from "react";
import "./CompOpenDental.scss";

const apiKey = "NFF6i0KrXrxDkZHt";
const developerKey = "VzkmZEaUWOjnQX2z";

const testAPIPut = async () => {
  alert("PUT Requests unable to be run from clientside, need proxy server OR backend interfacing layer to run cross-origin PUT requests")

};

const runApi = async (endpoint, type = "GET", data, callback = () => {}) => {
  var myHeaders = new Headers();
  myHeaders.append("Authorization", `ODFHIR ${apiKey}/${developerKey}`);
  myHeaders.append("Content-Type", "application/json");
  myHeaders.append("Access-Control-Allow-Origin", "*");
  myHeaders.append("Access-Control-Allow-Headers", "*");

  var requestOptions = {
    method: type,
    headers: myHeaders,
    redirect: "follow",
    // mode: 'cors'
  };
  if (type !== "GET") {
    requestOptions.body = JSON.stringify(data);
  }

  fetch("https://api.opendental.com/api/v1/" + endpoint, requestOptions)
    .then((response) => response.json())
    .then((result) => callback(result))
    .catch((error) => console.error(error));
};

function CompOpenDental() {
  const [loading, setLoading] = useState(true);
  const [response, setResponse] = useState("");

  const handleGetPatients = async () => {
    setLoading(true);
    runApi("patients", "GET", null, (response) => {
      console.log("patients get response?", response);
      setResponse(JSON.stringify(response, null, 2));
      setLoading(false);
    });
  };

  const handlePutPatientInfo = async () => {

    testAPIPut();

    // runApi('patients/123', 'PUT', data, (response) => {
    //   console.log("Got response from put", response)
    //   runApi('patients/123', 'GET', null, res => {
    //     setResponse(JSON.stringify(res, null, 2))
    //     setLoading(false)
    //   })
    // })
  };

  const handlePostPatientInfo = async () => {
    const data = {
      LName: "Alcobia",
      FName: "Jina",
      Birthdate: "1990-03-15",
    };

    setLoading(true);
    runApi("patients", "POST", data, (response) => {
      setResponse(JSON.stringify(response, null, 2));
      setLoading(false);
    });
  };

  return (
    <div className='comp-open-dental'>
      <h1>Open Dental Integration</h1>
      <div className='setup-instructions'>
        <h2>Setup</h2>
        <p>First, ensure office has eConnector running</p>
        <a href='https://www.opendental.com/manual/econnector.html'>
          https://www.opendental.com/manual/econnector.html
        </a>
        <p>
          Launch the Open Dental program. Enable the API by going to Setup -{">"} Advanced Setup -{">"} FHIR and
          checking the Enabled checkbox.
        </p>
        <p>
          Create API Keys via OpenDental Portal:
          <a href='https://api.opendental.com/portal/gwt/fhirportal.html'>
            https://api.opendental.com/portal/gwt/fhirportal.html
          </a>
        </p>

        <p>
          <a href='https://www.opendental.com/manual/fhir.html'>
            To assign an API key to an Open Dental customer, go to Setup -{">"} Advanced Setup -{">"} FHIR. Click the Add Key in
            the lower left. Here is where you paste a key generated from the developer portal.
          </a>{" "}
          The customer has the ability to enable or disable a key. The customer can view permissions granted to that
          key, but they cannot change those permissions. The interface in this window displays information from our HQ
          server, not the customer database.
        </p>

        <a href='https://www.opendental.com/resources/OpenDentalAPI.pdf'>Open Dental API Specification Documentation</a>
      </div>

      <div className='api-controls'>
        <h2>Under Construction (API Controls)</h2>
        <p>Base URL: https://api.opendental.com/api/v1</p>
        <div className='row'>
          <input placeholder='API KEY (from Open Dental)' value='NFF6i0KrXrxDkZHt' />
          <input placeholder='Developer API KEY (from vendor.relations@opendental.com)' value='VzkmZEaUWOjnQX2z' />
        </div>
        <div className='row'>
          <input placeholder='Patient First Name' />
          <input placeholder='Patient Last Name' />
          <input placeholder='Patient DOB' />
          <button onClick={handleGetPatients}>[GET] Patients Information</button>
        </div>
        <div className='row'>
          <input placeholder='Patient #' />
          <select>
            <option>Jina Alcobia</option>
          </select>
          <button onClick={handlePutPatientInfo}>[PUT] Updated Patient Information</button>
        </div>
        <div className='row'>
          <select>
            <option>Jina Alcobia</option>
          </select>
          <button onClick={handlePostPatientInfo}>[POST] Create Patient Information</button>
        </div>
        <h3>Response Data</h3>
        <div><pre>{loading ? "Loading..." : response}</pre></div>
        
      </div>
    </div>
  );
}

export default CompOpenDental;
