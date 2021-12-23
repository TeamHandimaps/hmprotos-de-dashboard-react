import React from "react";
import { NETWORK_TYPES } from "../model/DentalAPI";
import "./UtilRawResponseCustomDataTable.scss";

/** Column keys we will be using, which include the network types as well as a helper "Message" column. */
const COLUMN_KEYS = [...NETWORK_TYPES, "MESSAGE"];

/** Helper component to render a "labeled field". */
function LabeledField({ title, value }) {
  return (
    <div className="labeled-field">
      <h3>{title}:</h3>
      <p>{value || ""}</p>
    </div>
  );
}

/** Helper component to handle rendering each eligibility table when rendering the raw response custom data table. */
function EligibilitySubTable({ serviceName, eligibilityDetails }) {
  const BenefitMap = {};


  eligibilityDetails.forEach((eligibility, i) => {
    const {
      // Procedure,
      CoverageLevel,
      TimePeriodQualifier,
      QuantityQualifier,
      Quantity,
      EligibilityOrBenefit,
      HealthCareServiceDeliveries,
      Percent,
      MonetaryAmount,
      QuantityAmount,
      Message,
      PlanCoverageDescription,
    } = eligibility;

    // create map key
    let mapKey = EligibilityOrBenefit || serviceName || i;

    if (CoverageLevel) {
      mapKey = `${mapKey} (${CoverageLevel})`;
    }
    if (TimePeriodQualifier) {
      mapKey = `${mapKey} - ${TimePeriodQualifier}`;
    }
    if (QuantityQualifier) {
      mapKey = `${mapKey} - ${QuantityQualifier}`;
    }


    const currentBenefit = BenefitMap[mapKey] || {};
    // so we are looking at the BenefitMap[mapKey][PlanCoverageDescription], which is where we will store all "values" for the PlanCoverageDescription for that particular benefit
    let currentBenefitValues = currentBenefit[PlanCoverageDescription] || [];
    
    // extract any values we can and push them into that list
    if (HealthCareServiceDeliveries) {
      const deliveries = HealthCareServiceDeliveries.map((delivery) => {
        const { QuantityQualifier, TimePeriodQualifier, TotalNumberOfPeriods, TotalQuantity, DeliveryFrequency } =
          delivery;
        if ((!TotalQuantity || !TotalNumberOfPeriods) && DeliveryFrequency) {
          return `${DeliveryFrequency}`;
        }
        return `${TotalQuantity} ${QuantityQualifier} / ${TotalNumberOfPeriods} ${TimePeriodQualifier}`;
      });

      currentBenefitValues.push(deliveries.join(", "));
    } else if (Percent >= 0) {
      currentBenefitValues.push(`${parseFloat(Percent) * 100}%`);
    } else if (MonetaryAmount >= 0) {
      currentBenefitValues.push(`$${parseFloat(MonetaryAmount)}`);
    } else if (Quantity >= 0) {
      currentBenefitValues.push(Quantity);
    } else if (QuantityAmount >= 0) {
      currentBenefitValues.push(QuantityAmount);
    } else {
      // couldn't find any values to push ! (verify that we are using a valid format? or maybe it's a valid format we haven't seen before.)
    }

    // set the updated/extracted values back in the correct place
    currentBenefit[PlanCoverageDescription] = currentBenefitValues;

    // if we have a message to display (some kind of note or otherwise), then we can add it here
    if (Message) {
      let messageValues = currentBenefit["MESSAGE"] || [];
      Message.forEach((msg) => {
        if (!messageValues.includes(msg)) {
          messageValues.push(msg);
        }
      });
      currentBenefit["MESSAGE"] = messageValues;
    }

    // set the updated benefits back at the correct key 
    BenefitMap[mapKey] = currentBenefit;
  });

  // each benefit type/category for the service is a row
  // and each item of that benefit type/category is column ! 
  let rows = Object.keys(BenefitMap)
    .map((k) => {
      const benefit = BenefitMap[k];
      return (
        <tr key={k}>
          <td>{k}</td>
          {COLUMN_KEYS.map((t) => {
            const benefitDetail = benefit[t] || [];
            return <td key={t}>{benefitDetail.join(", ")}</td>;
          })}
        </tr>
      );
    });
  
  return (
    <table>
      <thead>
        <tr>
          <th>Benefit</th>
          {COLUMN_KEYS.map((t) => (
            <th key={t}>{t}</th>
          ))}
        </tr>
      </thead>
      <tbody>{rows}</tbody>
    </table>
  );
}

/** Handles rendering the raw response custom data table. Which renders a separate table for each "Service" or "Benefit".  */
export default function RawResponseCustomDataTable({ response }) {
  const { key, val } = response;
  if (!key || !val) {
    return "Invalid Response Format, please provide data in { key: string, val: object } format!";
  }

  const message = (response && response.val && response.val.APIResponseMessage) || "";
  if (message !== "Processed") {
    return "Invalid Response Data, must have information to parse!";
  }

  const { DemographicInfo, PayerName, PlanCoverageSummary, PverifyPayerCode, ServiceDetails } = val;
  const { EffectiveDate, ExpiryDate, GroupName, GroupNumber, PlanName, Status } = PlanCoverageSummary || {};
  const { Firstname, Lastname_R, DOB_R, Gender_R, State, Zip } = (DemographicInfo && DemographicInfo.Subscriber) || {};

  return (
    <div className="raw-response-table">
      <h2>Payer/Plan Info</h2>
      <div className="payer-info">
        <LabeledField title="Payer Name" value={PayerName} />
        <LabeledField title="Payer Code" value={PverifyPayerCode} />
        <LabeledField title="Status" value={Status} />
        <LabeledField title="Plan" value={PlanName} />
        <LabeledField title="Group" value={GroupName} />
        <LabeledField title="Group#" value={GroupNumber} />
        <LabeledField title="Effective Date" value={EffectiveDate} />
        <LabeledField title="Expiry Date" value={ExpiryDate} />
      </div>

      <h2>Subscriber Information</h2>

      <div className="payer-info">
        <LabeledField title="First Name" value={Firstname} />
        <LabeledField title="Last Name" value={Lastname_R} />
        <LabeledField title="Date of Birth" value={DOB_R} />
        <LabeledField title="Gender" value={Gender_R} />
        <LabeledField title="State" value={State} />
        <LabeledField title="Zip Code" value={Zip} />
      </div>

      <h2>Service Info</h2>
      <div className="service-info">{
      ServiceDetails.map((service) => {
        const { ServiceName, EligibilityDetails } = service;
        return (
          <details key={ServiceName}>
            <summary>{ServiceName}</summary>
            <EligibilitySubTable serviceName={ServiceName} eligibilityDetails={EligibilityDetails} />
          </details>
        );
      })
      }</div>
    </div>
  );
}
