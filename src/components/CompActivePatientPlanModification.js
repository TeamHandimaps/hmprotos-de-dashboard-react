import { get, getDatabase, ref } from "firebase/database";
import React, { useEffect, useState } from "react";
import "./CompActivePatientPlanModification.scss";
import DatabaseAPI from "../model/DatabaseAPI";

import { default as parseResponseData, NETWORK_TYPES } from "./UtilParseResponseData.js";

function getBenefitsFromOthers(serviceOthersDataInd, ServiceDetails) {
  if (serviceOthersDataInd < 0) { return [] }

  const Others = ServiceDetails[serviceOthersDataInd]
  const { EligibilityDetails } = Others

  let benefits = {}
  EligibilityDetails.forEach((s, sind) => {
    if (s.Procedure) {
      const benefitKey = s.Procedure
      const currentBenefitsData = benefits[benefitKey] || [sind, {}, {}]
      const currentBenefitsMap = currentBenefitsData[1]
      const currentBenefitsUsageMap = currentBenefitsData[2]
      if (s.EligibilityOrBenefit === "Limitations") {
        if (s.TimePeriodQualifier === "Remaining") {
          currentBenefitsUsageMap[s.PlanCoverageDescription] = s.QuantityAmount
        } else if (s.HealthCareServiceDeliveries && s.HealthCareServiceDeliveries[0].TotalQuantity) {
          currentBenefitsMap[s.PlanCoverageDescription] = s.HealthCareServiceDeliveries
        }
      }
      benefits[benefitKey] = [currentBenefitsData[0], currentBenefitsMap, currentBenefitsUsageMap]
    }
  })

  return Object.keys(benefits).map(k => [k, serviceOthersDataInd, -1, benefits[k][1], benefits[k][2]] )
}

function getBenefits(responseData) {
  if (!responseData.key || !responseData.val) { return [] }
  

  const { val } = responseData
  const { ServiceDetails } = val

  console.log("Getting benefits fromm", [ServiceDetails])

  const benefits_other_ind = ServiceDetails.findIndex(s => s.ServiceName === "Others")

  const benefits_other = getBenefitsFromOthers(benefits_other_ind, ServiceDetails) 
  const benefits = ServiceDetails.filter(s => s.ServiceName !== "Others").map((service, ind) => {

    const { EligibilityDetails } = service

    let limits = {}
    let usage = {}
    EligibilityDetails.forEach(d => {
      if (d.EligibilityOrBenefit === "Limitations") {
        if (d.TimePeriodQualifier === "Remaining") {
          usage[d.PlanCoverageDescription] = d.QuantityAmount
        } else if (d.HealthCareServiceDeliveries) {
          limits[d.PlanCoverageDescription] = d.HealthCareServiceDeliveries
        }
      }
    })

    return [service.ServiceName, ind, -1, limits, usage]
  })

  return [...benefits_other, ...benefits].filter(b => {
    // issue here, some map to the network type but dont have quantity amounts (somehow), NOT a problem with dental codes in OTHERS
    // figure out a better filtering algorithm
    return Object.keys(b[3]).length !== 0
  })
}

function getUsageInformation(selectedBenefitData, networkType) {
  console.log("Getting usage information for Selected benefit data", selectedBenefitData)
  if(selectedBenefitData.length == 0) { 
    return [0,'']
  }
  const [name, ind1, ind2, data, usage] = selectedBenefitData
  const [ amountData ] = (data && data[networkType]) || []

  const {  TotalQuantity, QuantityQualifier, TotalNumberOfPeriods, TimePeriodQualifier } = amountData || {}
  const remaining = (usage && usage[networkType]) || (TotalQuantity || 0)

  return [ TotalQuantity, `${QuantityQualifier} / ${TotalNumberOfPeriods} ${TimePeriodQualifier}`, TotalQuantity - remaining]
}

const defaultBenefit = {
  raw: ['', []],
  usageInfo: [0,'',0],
  usageAmount: 0
}

function UpdateBenefitUsageForm({ responseData, onSubmitUpdate = (data) => {} }) {
  const [benefits, setBenefits] = useState([]); // full benfits list 

  const [selectedBenefit, setSelectedBenefit] = useState(defaultBenefit);

  const [selectedNetworkType, setSelectedNetworkType] = useState(NETWORK_TYPES[0])

  useEffect(() => {
    const benefits = getBenefits(responseData)

    setBenefits(benefits)
  }, [responseData])


  if (!responseData) {
    return null;
  }

  const onSelectBenefitChange = evt => {
    const ind = evt.target.value
    const selectedBenefitData = benefits[ind]
    const benefitUsageInfo = getUsageInformation(selectedBenefitData, selectedNetworkType)
    const benefitData = {
      raw: [ind, selectedBenefitData],
      usageInfo: benefitUsageInfo,
      usageAmount: benefitUsageInfo[2]
    }
    console.log("Setting benefit data!", benefitData)
    setSelectedBenefit(benefitData)
  }

  const handleNetworkTypeChange = evt => {
    setSelectedNetworkType(evt.target.value)
    const benefitUsageInfo = getUsageInformation(selectedBenefit.raw[1], evt.target.value)
    setSelectedBenefit({
      ...selectedBenefit,
      usageInfo: benefitUsageInfo,
      usageAmount: benefitUsageInfo[2]
    })
  }

  const handleCurrentUsageChange = evt => {
    console.log("usage change?", evt.target.value)

    const usageMax = selectedBenefit.usageInfo[0]

    setSelectedBenefit({
      ...selectedBenefit,
      usageAmount: Math.max(0, Math.min(evt.target.value || 0, usageMax))
    })
  }

  const handleInputOnFocus = evt => {
    evt.target.select()
  }

  const handleBenefitUsageDataUpdate = (evt) => {
    evt.preventDefault();
    const updateData = { benefit: selectedBenefit.raw[1], networkType: selectedNetworkType, usageAmount: selectedBenefit.usageAmount }
    onSubmitUpdate(updateData)
  };

  const benefitsOptions = benefits.map((v, ind) => {
    return <option key={v[0]} value={ind}>{v[0]}</option>
  })

  const { raw, usageInfo, usageAmount } = selectedBenefit
  const [ selectedBenefitKey ] = raw
  const [ usageMax, usageLabel ] = usageInfo

  return (
    <form onSubmit={handleBenefitUsageDataUpdate}>
      <label>
        Benefit Name
        <select value={selectedBenefitKey} onChange={onSelectBenefitChange}>
          <option value='' disabled>
            Select Benefit To Populate Data
          </option>
          {benefitsOptions}
        </select>
      </label>

      <label>
        Network?
        <select disabled={!selectedBenefitKey} value={selectedNetworkType} onChange={handleNetworkTypeChange}>
          {NETWORK_TYPES.map(v => <option key={v} value={v}>{v}</option>)}
        </select>
      </label>

      <label>
        Maximum Usage ({usageLabel})
        <input disabled value={usageMax} />
      </label>

      <label>
        Current Usage ({usageLabel})
        <input disabled={!selectedBenefitKey} type="number" value={usageAmount} onFocus={handleInputOnFocus} onChange={handleCurrentUsageChange}/>
      </label>

      <button type='submit' disabled={!selectedBenefitKey}>
        Update Benefit Usage
      </button>
    </form>
  );
}

function CompActivePatientPlanModification({ patient, officeID="office_00"}) {
  const [loading, setLoading] = useState(true);
  const [response, setResponse] = useState(null);
  const [content, setContent] = useState(null);

  useEffect(() => {
    if (!patient.key) { return }
    const db = getDatabase();
    get(ref(db, "data/office_00/patients_data/" + patient.key))
      .then((snap) => {
        let result = null;
        snap.forEach((child) => {
          const childVal = child.val();
          if (!childVal.PlanCoverageSummary) {
            return;
          }

          const { EffectiveDate, ExpiryDate, Status } = childVal.PlanCoverageSummary;
          if (Status !== "Active") {
            return;
          }

          const startDate = EffectiveDate && new Date(EffectiveDate);
          const endDate = ExpiryDate && new Date(ExpiryDate);
          const today = Date.now();

          if (today < startDate.getTime() || endDate.getTime() < today) {
            return;
          }
          result = { key: child.key, val: childVal };
        });

        if (result) {
          parseResponseData(result, (contentToSet) => {
            console.log("Found valid plan response! Setting Data");
            setContent(contentToSet);
            setResponse(result);
          });
        } 

        return true;
      })
      .catch((err) => {
        console.error("Error getting most valid plan?", err);
        return false;
      })
      .finally(() => {
        setLoading(false)
      })
  }, [patient.key]);

  const handleSubmitUsageUpdate = (usageData) => {
    const { benefit, networkType, usageAmount } = usageData;
    console.log("Submitting usage data to db cache!")
    DatabaseAPI.updateUsageInfo(officeID, patient.key, response, benefit, networkType, usageAmount);
  };


  return (
    <div className='comp-active-patient-plan-modification-form'>
      <h3>Update Current Benefit Usage</h3>
      {loading ? "Loading Plan Benefits..." : <UpdateBenefitUsageForm responseData={response} onSubmitUpdate={handleSubmitUsageUpdate} />}
      <h3>Active Plan Details</h3>
      {loading ? "Loading Active Plan..." : <div className='content'>{content}</div>}
    </div>
  );
}

export default CompActivePatientPlanModification;
