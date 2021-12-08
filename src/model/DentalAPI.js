import { getDatabase, ref, set, query, get, orderByChild, equalTo } from "firebase/database";
import flattenJSONResponse from "./Utils";

/** List of network types expected to be seen for any particular benefit. */
export const NETWORK_TYPES = ["IN NETWORK", "OUT OF NETWORK", "OUT OF SERVICE AREA"]


// constants
const _clapid = "ff286614-afbb-42c0-b9c2-c6df32a52429";
const _clse = "vf43TMzszrNkOpakboJwyujPvMuD5w";
const _offid = "office_00";

// utility
/** Helper function to handle the complex building of an eligibility request given a token and some data. */
function _buildEligibilityRequest(token, data) {
  console.log("Building eligibility request", data);
  var myHeaders = new Headers();
  myHeaders.append("Authorization", `Bearer ${token}`);
  myHeaders.append("Client-API-Id", _clapid);
  myHeaders.append("Content-Type", "application/json");

  let body = {
    ClientUserID: 0,
    PayerCode: data.PayerCode, //"DE0171",
    PayerName: data.PayerName, //"Delta Dental of Washington",
    Provider: {
      FullName: data.ProviderName,
      FirstName: "", // always empty ?
      MiddleName: "", // always empty ?
      LastName: data.ProviderName, // " test name",
      NPI: data.ProviderNpi, // "1427006147",
      TaxId: data.ProviderTaxId, //"123456789",
    },
    Subscriber: {
      FirstName: data.SubscriberFirstName || null, //"",
      MiddleName: data.SubscriberMiddleName || null,
      LastName: data.SubscriberLastName || null, //"",
      DOB: data.SubscriberDob || null, //"01/01/1950",
      Gender: data.SubscriberGender || null,
      Suffix: data.SubscriberSuffix || null,

      SSN: data.SubscriberSsn || null,

      MemberID: data.SubscriberMemberId, //"1234567890",
      MedicareId: data.SubscriberMedicareId || null,
      MedicaidId: data.SubscriberMedicaidId || null,
    },

    Dependent: null,
    isSubscriberPatient: data.PayerVerificationType === "Self" ? "True" : "False",

    doS_StartDate: data.MiscFromDate, //"02/02/2021",
    doS_EndDate: data.MiscToDate, //"02/02/2021",
    PracticeTypeCode: "86",
    ReferenceId: "Pat MRN",
    Location: data.MiscLocation, //"Any location Name",
    IncludeTextResponse: true,
    IncludeHtmlResponse: true,
  };

  if (data.PayerVerificationType === "Dependent") {
    body.Dependent = {
      Patient: {
        FirstName: data.PatientFirstName,
        LastName: data.PatientLastName,
        DOB: data.PatientDOB
        
      }
    }
  }

  console.log("Using this for body:", body);

  return {
    method: "POST",
    headers: myHeaders,
    body: JSON.stringify(body),
    redirect: "follow",
  };
}

/** Helper function to handle updating the database after getting an eligibility response. */
async function _handleUpdateDatabaseForEligibilityResponse(requestData, responseData) {
  console.log("Request", requestData, "Response", responseData);

  const patientID =
    `${requestData.SubscriberMemberId}_${requestData.SubscriberFirstName}_${requestData.SubscriberLastName}`.toLowerCase();

  const db = getDatabase();
  const refMeta = ref(db, `data/${_offid}/meta`);
  const refPatientsList = ref(db, `data/${_offid}/patients/${patientID}`);
  const refPatientsData = ref(db, `data/${_offid}/patients_data/${patientID}/${responseData.RequestID}`);
  
  const flatResponseData = await flattenJSONResponse(responseData)
  
  set(refMeta, {
    name: requestData.ProviderName,
    npi: requestData.ProviderNpi,
    taxid: requestData.ProviderTaxId,
  });

  set(refPatientsList, {
    lastRequestTime: Date.now(),
    lastRequestID: responseData.RequestID,
    patientName: `${requestData.SubscriberFirstName} ${requestData.SubscriberLastName}`,
    patientDOB: requestData.SubscriberDob,
    patientMemberID: requestData.SubscriberMemberId
  });

  const patientData = { ...flatResponseData, timestamp: Date.now() };
  set(refPatientsData, patientData);


}

/** Helper function to attempt retrieving an existing eligibility response from the database. */
async function _tryRetrieveExistingResponseFromDB(data) {
  const patientID =
    `${data.SubscriberMemberId}_${data.SubscriberFirstName}_${data.SubscriberLastName}`.toLowerCase();

  const db = getDatabase()
  const existingRef = query(ref(db, `data/${_offid}/patients_data/${patientID}`), orderByChild('PverifyPayerCode'), equalTo(data.PayerCode))
  const existingSnap = await get(existingRef)
  const existingResponse = existingSnap && existingSnap.val()
  const key = existingResponse && Object.keys(existingResponse) && Object.keys(existingResponse)[0]

  // at this point, we might as well check if request fields from Data match up in the entry that was found. No point in sending back a stale transaction for an old verification that has vastly different request parameters.
  return existingResponse && existingResponse[key]
}

class DentalAPI {
  /** Cached token value. */
  static _token = {};

  /** Helper function to get a token or return current valid one. */
  static _getToken() {
    return new Promise((resolve, reject) => {
      if (DentalAPI._token) {
        let now = Date.now();
        let time = DentalAPI._token.timestamp + DentalAPI._token.expires_in * 1000;
        if (now < time) {
          console.log("Token not expired, returning cached!");
          resolve(DentalAPI._token.access_token);
          return;
        }
        console.log("Token expired, fetching new one!");
      } else {
        console.log("No token, fetching new one!");
      }

      // couldn't use cached token? then we need to start a token request
      var urlencoded = new URLSearchParams();
      urlencoded.append("Client_Id", _clapid);
      urlencoded.append("Client_Secret", _clse);
      urlencoded.append("grant_type", "client_credentials");
    
      const requestOptions =  {
        method: "POST",
        body: urlencoded,
        redirect: "follow",
      };
      
      fetch("https://api.pverify.com/Token", requestOptions)
        .then((response) => response.json())
        .then((json) => {
          DentalAPI._token = {
            ...json,
            timestamp: Date.now(),
          };
          resolve(DentalAPI._token.access_token);
          return true;
        })
        .catch((error) => {
          reject(error);
          console.error("Error getting token:", error);
          return false;
        });
    });
  }

  /** Runs eligibility request given data. */
  static getEligibility(data) {
    console.log("Running /getEligibility with", data);
    return new Promise(async (resolve, reject) => {
      const existingResponse = await _tryRetrieveExistingResponseFromDB(data)
      if (existingResponse) {
        console.log("Got existing response!")
        
        resolve(existingResponse);
        return
      } else {
        console.log("No existing response, running pVerify API")
        // reject({})
        // return 
      }
      // get token
      const token = await DentalAPI._getToken().catch(() => "");
      if (!token) {
        reject("Cannot retrieve access token!");
      } else {
        console.log("Got token!");
      }
      // build request
      const requestOptions = _buildEligibilityRequest(token, data);
      // run api
      console.log("Running api...");
      fetch("https://api.pverify.com/api/DentalEligibilitySummary", requestOptions)
        .then((response) => response.json())
        .then((json) => {
          console.log("Got response from [/api/DentalEligibilitySummary]:", json);

          _handleUpdateDatabaseForEligibilityResponse(data, json);
          // resolve
          resolve(json);

          return true;
        })
        .catch((error) => {
          reject(error);
          console.error("Error getting token:", error);
          return false;
        });
    });
  }
}

export default DentalAPI;
