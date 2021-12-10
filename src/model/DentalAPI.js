import axios from "axios";
import dayjs from "dayjs";
import qs from "qs";
import DatabaseAPI from "./DatabaseAPI";

/** List of network types expected to be seen for any particular benefit. */
export const NETWORK_TYPES = ["IN NETWORK", "OUT OF NETWORK", "OUT OF SERVICE AREA"];

// constants, TODO: need to add these as env variables instead?
const _clapid = "ff286614-afbb-42c0-b9c2-c6df32a52429";
const _clse = "vf43TMzszrNkOpakboJwyujPvMuD5w";

/** Interface For accessing Dental API (pVerify). */
class DentalAPI {
  // cached fields
  /** Cached token value. */
  static _token = {};

  // utility
  /**
   * Helper function to get a token or return current valid one.
   *
   * @returns Token value if exists or was successfully queried from the API, throws error otherwise.
   */
  static async _getToken() {
    if (DentalAPI._token) {
      let now = dayjs().valueOf()
      let time = DentalAPI._token.timestamp + DentalAPI._token.expires_in * 1000;
      if (now < time) {
        console.log("Token not expired, returning cached!");
        return DentalAPI._token.access_token;
      }
      console.log("Token expired, fetching new one!");
    } else {
      console.log("No token, fetching new one!");
    }

    // start a new token request if necessary
    const config = {
      method: "post",
      url: "https://api.pverify.com/Token",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      data: qs.stringify({
        Client_Id: _clapid,
        Client_Secret: _clse,
        grant_type: "client_credentials",
      }),
    };
    return axios(config)
      .then((response) => response.data)
      .then((json) => {
        console.log("Got json?", json)
        DentalAPI._token = {
          ...json,
          timestamp: dayjs().valueOf(),
        };
        return DentalAPI._token.access_token;
      }).catch(error => {
        console.error("Error getting token", error)
        return ''
      })
  }

  /**
   * Helper function to handle the complex building of an eligibility request given a token and some data.
   *
   * @param {string} token
   * @param {object} requestFormData
   * @returns
   */
  static _buildEligibilityRequest(token, requestFormData) {
    let body = {
      ClientUserID: 0,
      PayerCode: requestFormData.PayerCode, //"DE0171",
      PayerName: requestFormData.PayerName, //"Delta Dental of Washington",
      Provider: {
        FullName: requestFormData.ProviderName,
        FirstName: "", // always empty ?
        MiddleName: "", // always empty ?
        LastName: requestFormData.ProviderName, // " test name",
        NPI: requestFormData.ProviderNpi, // "1427006147",
        TaxId: requestFormData.ProviderTaxId, //"123456789",
      },
      Subscriber: {
        FirstName: requestFormData.SubscriberFirstName || null, //"",
        MiddleName: requestFormData.SubscriberMiddleName || null,
        LastName: requestFormData.SubscriberLastName || null, //"",
        DOB: requestFormData.SubscriberDob || null, //"01/01/1950",
        Gender: requestFormData.SubscriberGender || null,
        Suffix: requestFormData.SubscriberSuffix || null,

        SSN: requestFormData.SubscriberSsn || null,

        MemberID: requestFormData.SubscriberMemberId, //"1234567890",
        MedicareId: requestFormData.SubscriberMedicareId || null,
        MedicaidId: requestFormData.SubscriberMedicaidId || null,
      },

      Dependent: null,
      isSubscriberPatient: requestFormData.PayerVerificationType === "Self" ? "True" : "False",

      doS_StartDate: requestFormData.MiscFromDate, //"02/02/2021",
      doS_EndDate: requestFormData.MiscToDate, //"02/02/2021",
      PracticeTypeCode: "86",
      ReferenceId: "Pat MRN",
      Location: requestFormData.MiscLocation, //"Any location Name",
      IncludeTextResponse: true,
      IncludeHtmlResponse: true,
    };

    if (requestFormData.PayerVerificationType === "Dependent") {
      body.Dependent = {
        Patient: {
          FirstName: requestFormData.PatientFirstName,
          LastName: requestFormData.PatientLastName,
          DOB: requestFormData.PatientDOB,
        },
      };
    }


    return {
      method: 'post',
      url: 'https://api.pverify.com/api/DentalEligibilitySummary',
      headers: { 
        'Authorization': `Bearer ${token}`, 
        'Client-API-Id': _clapid, 
        'Content-Type': 'application/json'
      },
      data : JSON.stringify(body)
    };
  }

  /** Runs eligibility request given data.
   *
   * @param {string} officeID Office ID to use for running the request.
   * @param {object} requestFormData Request Form Data for extracting necessary request details for. Should come from Eligibility Verification Form.
   * @returns
   */
  static async getEligibility(officeID, requestFormData) {
    const existingResponse = await DatabaseAPI.tryGetExistingResponseFromDatabase(officeID, requestFormData);
    if (existingResponse) {
      console.log("Got existing response!");
      return existingResponse;
    } else {
      console.log("No existing response, running pVerify API");
      // reject({})
      // return
    }
    // get token
    const token = await DentalAPI._getToken().catch(() => "");
    if (!token) {
      throw new Error("Cannot retrieve access token from API!");
    } else {
      console.log("Got token!");
    }
    // build request
    const axiosRequestConfig = DentalAPI._buildEligibilityRequest(token, requestFormData);
    // run api
    return axios(axiosRequestConfig)
      .then((response) => response.data)
      .then(async (json) => {
        console.log("Got response from [/api/DentalEligibilitySummary]:", json);
        await DatabaseAPI.updateDatabaseWithEligibilityResponse(officeID, requestFormData, json);
        return json;
      });
  }
}

export default DentalAPI;
