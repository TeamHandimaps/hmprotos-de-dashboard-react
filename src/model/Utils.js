import { NETWORK_TYPES } from "./DentalAPI";

/** Sorting types. */
export const SortingTypes = {
  BY_NETWORK_TYPE: 1,
  BY_BENEFIT_TYPE: 2,
};
/** Freeze it. */
if (Object.freeze) {
  Object.freeze(SortingTypes);
}

/// UTILS FUNCTIONS FOR GENERAL QOL ADJUSTMENTS
/**
 * Helper function to put a value into an array in the map. Expecting an array at map[key].
 *
 * @param {object} map The map to MODIFY.
 * @param {string} key The key in the map to use the array value at to insert the given value in.
 * @param {any} value The value to insert into the array at the key in the map.
 */
function putInMapAsArray(map, key, value) {
  let current = map[key] || [];
  current.push(value);
  map[key] = current;
}

/**
 * Helper function to return the appropriate unique key identifier for a benefit from a "detail" object.
 *
 * @param {object} detail The detail object identified by the given key.
 * @param {string} currentKey The current key being used to identify this detail, to be enhanced if possible by the data contained within the detail object.
 * @returns The key with extra uniquely identifying information attached to it, or if not possible then the key itself.
 */
function extractBenefitKey(detail, currentKey) {
  let result = currentKey;
  if (detail.TimePeriodQualifier) {
    let qualifiers = [detail.TimePeriodQualifier];
    if (detail.QuantityAmount && detail.QuantityQualifier) {
      qualifiers.push(detail.QuantityQualifier);
    }
    result += ` (${qualifiers.join(" ")})`;
  }
  return result;
}

/**
 * Extracts the "value" out of any particular eligibility detail format. Whether that is a percentage, monetary amount,
 * quantity amount, insurance type, etc. The exact type can be inferred with context later, so it is okay to just pull
 * out the value like this for display purposes.
 *
 * @param {object} eligibilityDetail The eligibility detail object containing value information.
 * @returns Any found value information extracted from the given object.
 */
function extractValue(eligibilityDetail) {
  if (eligibilityDetail.Percent) {
    return `${parseFloat(eligibilityDetail.Percent) * 100}%`;
  } else if (eligibilityDetail.MonetaryAmount) {
    return `$${parseFloat(eligibilityDetail.MonetaryAmount).toFixed(2)}`;
  } else if (eligibilityDetail.QuantityAmount) {
    return eligibilityDetail.QuantityAmount;
  } else if (eligibilityDetail.Quantity) {
    return `${eligibilityDetail.Quantity} ${eligibilityDetail.QuantityQualifier}`;
  } else if (eligibilityDetail.InsuranceType) {
    return eligibilityDetail.InsuranceType;
  } else if (eligibilityDetail.HealthCareServiceDeliveries) {
    // parse

    const deliveries = eligibilityDetail.HealthCareServiceDeliveries.map((delivery) => {
      const { QuantityQualifier, TimePeriodQualifier, TotalNumberOfPeriods, TotalQuantity, DeliveryFrequency } =
        delivery;
      if ((!TotalQuantity || !TotalNumberOfPeriods) && DeliveryFrequency) {
        return `${DeliveryFrequency}`;
      }
      return `${TotalQuantity} ${QuantityQualifier} / ${TotalNumberOfPeriods} ${TimePeriodQualifier}`;
    });

    return deliveries.join(", ");
  } else {
    // console.log("Couldn't extract value?", eligibilityDetail)
  }
  return "";
}

// Flattening Methods for either pre-formatting data for caching in database
// or formatting data in a specific way to be more easily displayed clientside.
/**
 * Flattens the ServiceDetails portion of a pVerify JSON response into a single array of benefits objects instead of
 * leaving the "others" category to hold a sub array of many different specific benefits.
 *
 * @param {object} response Response data to flatten.
 * @returns Flattened Response, which is just the ServiceDetails field of the response having its "other" category flattened out to the higher level.
 */
export default async function flattenJSONResponse(response) {
  const { ServiceDetails } = response; // this is our bread and butter for eligibility data
  if (!ServiceDetails || !(ServiceDetails instanceof Array)) {
    return response;
  }

  const OthersDataInd = ServiceDetails.findIndex((sd) => sd.ServiceName === "Others");
  if (OthersDataInd === -1) {
    return response;
  } // no reason to flatten at this point

  const OthersData = ServiceDetails[OthersDataInd];
  const { EligibilityDetails } = OthersData;

  const OthersDataMap = {};
  EligibilityDetails.forEach((ed) => {
    // determine its "ServiceName"
    // append
    let edkey = ed.Procedure || "Plan General";

    let current = OthersDataMap[edkey] || [];
    current.push(ed);
    OthersDataMap[edkey] = current;
  });

  const FlattenedOthersServices = Object.keys(OthersDataMap).map((k) => {
    return { EligibilityDetails: OthersDataMap[k], ServiceName: k };
  });

  let NewServiceDetails = ServiceDetails.slice();
  NewServiceDetails.splice(OthersDataInd, 1); // NewServiceDetails now does not have "Others" entry
  NewServiceDetails = [...NewServiceDetails, ...FlattenedOthersServices];

  return { ...response, ServiceDetails: NewServiceDetails };
}

/**
 * Flattens the eligibility details list into different formats depending on the current chosen sorting type.
 *
 * @param {object} eligibilityDetails The eligibility details list of all benefits applicable to a service/eligibility
 * @param {SortingTypes} sortingType Type to sort  by
 * @returns List of eligibility details flattened to allow for display in a certain specified format.
 */
export async function flattenToSortingStyle(serviceName, eligibilityDetails, sortingType = SortingTypes.BY_BENEFIT_TYPE) {
  let newEligibilityDetails = [];

  const createRemainingLimitation = (network = "IN NETWORK", qualifier = "Visits", amount = 2) =>{
    return {
      "EligibilityOrBenefit" : "Limitations",
      "PlanCoverageDescription" : network,// "IN NETWORK", // what you might change/add
      "PlanNetworkIndicator" : "Yes",
      "Procedure" : serviceName, // "American Dental Association Codes:D0140",
      "QuantityAmount" : amount, //2,
      "QuantityQualifier" : qualifier, //"Visits",
      "TimePeriodQualifier" : "Remaining"
    }
  }

  if (sortingType === SortingTypes.BY_BENEFIT_TYPE) {
    let mappedToBenefits = {};
    let sawVisits = false
    let sawLimitations = false
    eligibilityDetails.forEach((v) => {
      let key = extractBenefitKey(v, v.EligibilityOrBenefit);
      putInMapAsArray(mappedToBenefits, key, v);
      const jsonVal = JSON.stringify(v)
      if (jsonVal.includes('visit') || jsonVal.includes("Visit")) {
        sawVisits = true
      }
      if (key === "Limitations (Remaining Visits)") {
        sawLimitations = true
      }
    });

    if (sawVisits && !sawLimitations) {
      // console.log("Adding default limitations usage for", serviceName, mappedToBenefits)

      // get amount now 
      let valueToUse = 2
      mappedToBenefits["Limitations"].forEach(info => {
        if (info.HealthCareServiceDeliveries && info.HealthCareServiceDeliveries.length > 0) {
          valueToUse = info.HealthCareServiceDeliveries[0].TotalQuantity || 2
        }
      })
      
      // add default limitations!
      NETWORK_TYPES.forEach(type => {
        putInMapAsArray(mappedToBenefits, "Limitations (Remaining Visits)", createRemainingLimitation(type, "Visits", valueToUse))
      })
    }

    Object.keys(mappedToBenefits).forEach((key) => {
      let row = {
        benefit: key,
        editable: key === "Limitations (Remaining Visits)",
        editable_cells: ["in_network", "out_of_network", "out_of_service_area"],
        raw: {},
      };
      mappedToBenefits[key].forEach((detail) => {
        if (!detail.PlanCoverageDescription) {
          row = {
            ...row,
            coverage: detail.CoverageLevel || "",
            indicator: detail.PlanNetworkIndicator || "",
            authorization: detail.AuthorizationOrCertificationRequired || "",
            messages: detail.Message,
          };
          NETWORK_TYPES.forEach((ntkey) => {
            row[ntkey] = "";
            row.raw[ntkey] = "";
          });
        } else {
          const networkKey = detail.PlanCoverageDescription.toLowerCase().replaceAll(" ", "_");
          row = {
            ...row,
            coverage: detail.CoverageLevel || "",
            indicator: detail.PlanNetworkIndicator || "",
            authorization: detail.AuthorizationOrCertificationRequired || "",
            messages: detail.Message,
          };
          row[networkKey] = extractValue(detail);
          row.raw[networkKey] = detail;
        }
      });
      newEligibilityDetails.push(row);
    });
  } else {
    let mappedToNetwork = {
    };
    
    let sawVisits = false
    let sawLimitations = false
    eligibilityDetails.forEach((v) => {
      if (v.PlanCoverageDescription) {
        putInMapAsArray(mappedToNetwork, v.PlanCoverageDescription, v);
        const jsonVal = JSON.stringify(v)
        if (jsonVal.includes('visit') || jsonVal.includes("Visit")) {
          sawVisits = true
        }
        if (jsonVal.includes("Limitations") && jsonVal.includes("Remaining")) {
          sawLimitations = true
        }
      } else {
        NETWORK_TYPES.forEach((nt) => putInMapAsArray(mappedToNetwork, nt, v));
      }
      // TODO add default limitations?
    });

    if (sawVisits && !sawLimitations) {
      // console.log("Adding default limitations usage for", serviceName, mappedToNetwork)

      // get amount now 
      let valueToUse = 2
      NETWORK_TYPES.forEach(type => {
        mappedToNetwork[type].forEach(info => {
          if (info.EligibilityOrBenefit === "Limitations" && info.HealthCareServiceDeliveries && info.HealthCareServiceDeliveries.length > 0) {
            valueToUse = info.HealthCareServiceDeliveries[0].TotalQuantity || 2
          }
        })
      })
      

      // add default limitations!
      NETWORK_TYPES.forEach(type => {
        putInMapAsArray(mappedToNetwork, type, createRemainingLimitation(type, "Visits", valueToUse))
      })
    }
    

    Object.keys(mappedToNetwork).forEach((key) => {
      mappedToNetwork[key].forEach((detail) => {
        // convert to format
        let benefit = extractBenefitKey(detail, detail.EligibilityOrBenefit);
        const row = {
          network: key,
          editable: benefit === "Limitations (Remaining Visits)",
          editable_cells: ["value"],
          benefit: benefit,
          coverage: detail.CoverageLevel || "",
          indicator: detail.PlanNetworkIndicator,
          authorization: detail.AuthorizationOrCertificationRequired,
          raw: detail,
          value: extractValue(detail), // varies
          messages: detail.Message,
        };
        newEligibilityDetails.push(row);
      });
    });
  }

  return newEligibilityDetails;
}
