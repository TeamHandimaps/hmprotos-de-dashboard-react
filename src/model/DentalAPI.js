import { getDatabase, ref, set, push } from "firebase/database";

// constants
const _clapid = "ff286614-afbb-42c0-b9c2-c6df32a52429";
const _clse = "vf43TMzszrNkOpakboJwyujPvMuD5w";
const _offid = "office_00";

// utility
function _buildTokenRequest() {
  var urlencoded = new URLSearchParams();
  urlencoded.append("Client_Id", _clapid);
  urlencoded.append("Client_Secret", _clse);
  urlencoded.append("grant_type", "client_credentials");

  return {
    method: "POST",
    body: urlencoded,
    redirect: "follow",
  };
}

function _buildEligibilityRequest(token, data) {
  console.log("Building eligibility request", data);
  var myHeaders = new Headers();
  myHeaders.append("Authorization", `Bearer ${token}`);
  myHeaders.append("Client-API-Id", _clapid);
  myHeaders.append("Content-Type", "application/json");

  var body = {
    ClientUserID: 0,
    PayerCode: data.PayerCode, //"DE0171",
    PayerName: data.PayerName, //"Delta Dental of Washington",
    Provider: {
      FullName: data.ProviderName,
      FirstName: "",
      MiddleName: "",
      LastName: data.ProviderName, // " test name",
      NPI: data.ProviderNpi, // "1427006147",
      TaxId: data.ProviderTaxId, //"123456789",
    },
    Subscriber: {
      FirstName: data.SubscriberFirstName, //"",
      MiddleName: null,
      LastName: data.SubscriberLastName, //"",
      DOB: data.SubscriberDob, //"01/01/1950",
      Gender: null,
      Suffix: null,

      SSN: null,

      MemberID: data.SubscriberMemberId, //"1234567890",
      GroupNo: null,
      MedicareId: null,
      MedicaidId: null,
    },

    Dependent: null,
    isSubscriberPatient: "True",

    doS_StartDate: data.MiscFromDate, //"02/02/2021",
    doS_EndDate: data.MiscToDate, //"02/02/2021",
    PracticeTypeCode: "86",
    ReferenceId: "Pat MRN",
    Location: data.MiscLocation, //"Any location Name",
    IncludeTextResponse: true,
    IncludeHtmlResponse: true,
  };

  console.log("Using this for body:", body);

  return {
    method: "POST",
    headers: myHeaders,
    body: JSON.stringify(body),
    redirect: "follow",
  };
}

function _handleUpdateDatabaseForEligibilityResponse(requestData, responseData) {
  console.log("Request", requestData, "Response", responseData);

  const patientID =
    `${requestData.SubscriberMemberId}_${requestData.SubscriberFirstName}_${requestData.SubscriberLastName}`.toLowerCase();

  const db = getDatabase();
  const refMeta = ref(db, `data/${_offid}/meta`);
  const refPatientsList = ref(db, `data/${_offid}/patients/${patientID}`);
  const refPatientsData = ref(db, `data/${_offid}/patients_data/${patientID}/${responseData.RequestID}`);

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

  const patientData = { ...responseData, timestamp: Date.now() };

  set(refPatientsData, patientData);
}

class DentalAPI {
  static _token = {};

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
      const requestOptions = _buildTokenRequest();
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

  static getEligibility(data) {
    console.log("Running /getEligibility with", data);
    return new Promise(async (resolve, reject) => {
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
