import React from "react";
import './UtilParseResponseData.scss'

export const NETWORK_TYPES = ["IN NETWORK", "OUT OF NETWORK", "OUT OF SERVICE AREA"];
const COLUMN_KEYS = [...NETWORK_TYPES, "MESSAGE"];

function LabeledField({ title, value }) {
  return (
    <div className='labeled-field'>
      <h3>{title}:</h3>
      <p>{value || ""}</p>
    </div>
  );
}

function getEligibilityTable(serviceName, eligibilityDetails) {
  const BenefitMap = {};

  eligibilityDetails.forEach((eligibility, i) => {
    const {
      Procedure,
      CoverageLevel,
      TimePeriodQualifier,
      QuantityQualifier,
      Quantity,
      EligibilityOrBenefit,
      HealthCareServiceDeliveries,
      Percent,
      MonetaryAmount,
      Message,
      PlanCoverageDescription,
    } = eligibility;

    let mapKey = EligibilityOrBenefit || serviceName || i;
    if (Procedure) {
      mapKey = `${Procedure.split(":")[1]}: ${mapKey}`;
    }
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
    let currentBenefitValues = currentBenefit[PlanCoverageDescription] || [];

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
    } else if (Percent) {
      currentBenefitValues.push(`${parseFloat(Percent) * 100}%`);
    } else if (MonetaryAmount) {
      currentBenefitValues.push(`$${parseFloat(MonetaryAmount)}`);
    } else if (Quantity) {
      currentBenefitValues.push(Quantity);
    }

    currentBenefit[PlanCoverageDescription] = currentBenefitValues;

    if (Message) {
      let messageValues = currentBenefit["MESSAGE"] || [];
      Message.forEach((msg) => {
        if (!messageValues.includes(msg)) {
          messageValues.push(msg);
        }
      });
      currentBenefit["MESSAGE"] = messageValues;
    }

    BenefitMap[mapKey] = currentBenefit;
  });

  let rows = Object.keys(BenefitMap).map((k) => {
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

  if (serviceName === "Others") {
    rows = rows.slice(2);
  }

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
      <tbody>
      {rows}
      </tbody>
    </table>
  );
}


export default async function parseResponseData(data, callback = () => {}) {
  const { key, val } = data;
  if (!key || !val) {
    return;
  }
  const { DemographicInfo, PayerName, PlanCoverageSummary, PverifyPayerCode, ServiceDetails } = val;
  const { EffectiveDate, ExpiryDate, GroupName, GroupNumber, PlanName, Status } = PlanCoverageSummary || {};
  const { Firstname, Lastname_R, DOB_R, Gender_R, State, Zip } = (DemographicInfo && DemographicInfo.Subscriber) || {};

  const serviceContent = ServiceDetails.map((service) => {
    const { ServiceName, EligibilityDetails } = service;
    return (
      <details key={ServiceName}>
        <summary>{ServiceName}</summary>
        {getEligibilityTable(ServiceName, EligibilityDetails)}
      </details>
    );
  });

  const jsxContent = (
    <div className="raw-response-table">
      <h2>Payer/Plan Info</h2>
      <div className='payer-info'>
        <LabeledField title='Payer Name' value={PayerName} />
        <LabeledField title='Payer Code' value={PverifyPayerCode} />
        <LabeledField title='Status' value={Status} />
        <LabeledField title='Plan' value={PlanName} />
        <LabeledField title='Group' value={GroupName} />
        <LabeledField title='Group#' value={GroupNumber} />
        <LabeledField title='Effective Date' value={EffectiveDate} />
        <LabeledField title='Expiry Date' value={ExpiryDate} />
      </div>

      <h2>Subscriber Information</h2>

      <div className='payer-info'>
        <LabeledField title='First Name' value={Firstname} />
        <LabeledField title='Last Name' value={Lastname_R} />
        <LabeledField title='Date of Birth' value={DOB_R} />
        <LabeledField title='Gender' value={Gender_R} />
        <LabeledField title='State' value={State} />
        <LabeledField title='Zip Code' value={Zip} />
      </div>

      <h2>Service Info</h2>
      <div className='service-info'>{serviceContent}</div>
    </div>
  );

  callback(jsxContent);
}