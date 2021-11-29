import { getDatabase, ref, set } from "firebase/database"
import { NETWORK_TYPES } from "../components/UtilRawResponseCustomDataTable"

class DatabaseAPI {
    static async updateUsageInfo(officeID = "office_00", patientKey, responseData, benefitData, networkType, max, amount, qualifier) {
        const { key, val } = responseData
        if (!key || !val) { return }

        const { ServiceDetails } = val || []
        const [ benefitKey, parentInd, /* childInd, limits, usage */ ] = benefitData

        console.log(benefitKey, ": updating usage amount to:", amount)

        const service = ServiceDetails[parentInd] || {}
        const { ServiceName, EligibilityDetails } = service
        console.log("Got Eligibility Details for", ServiceName, ":", EligibilityDetails)

        let newEligibilityDetails = [...EligibilityDetails]

        // look for current usage, if any
        console.log("Looking for current usage data...")
        const foundInd = EligibilityDetails.findIndex((v, ind) => {
            const checkKeyMatch = ServiceName === "Others" ? benefitKey === v.Procedure : true
            return checkKeyMatch && v.EligibilityOrBenefit === "Limitations" && v.TimePeriodQualifier === "Remaining"
        })
        if (foundInd !== -1) {
            console.log("Found current usage, merging!")
            // merge found object with amount update
            const newUsageInfoObject = {...EligibilityDetails[foundInd], QuantityAmount: amount}
            newEligibilityDetails[foundInd] = newUsageInfoObject // replace in list
        } else {
            console.log("No current usage, going with generated data entry")
            const newUsageInfoObject = {
                EligibilityOrBenefit: "Limitations",
                PlanCoverageDescription: networkType,
                PlanNetworkIndicator: "Yes",
                Procedure: benefitKey,
                TimePeriodQualifier: "Remaining",
                QuantityAmount: max - amount,
                QuantityQualifier: qualifier
            }
            newEligibilityDetails.push(newUsageInfoObject) // push to list
        }
        console.log("Going to update database with", newEligibilityDetails)



        const db = getDatabase()
        const responseEligibilityDetailsRef = ref( db, `data/${officeID}/patients_data/${patientKey}/${key}/ServiceDetails/${parentInd}/EligibilityDetails` )
        console.log("Using response ref?", responseEligibilityDetailsRef.toString())
        return set(responseEligibilityDetailsRef, newEligibilityDetails)
            .then(res => {
                console.log("Updated successfully?", res)
            })
            .catch(err => {
                console.error("Error updating database", err)
            })

    }

    static async updateUsageRow(responseData, officeID = "office_00", patientKey, responseKey, serviceName, networkType, amount) {
        console.log("Trying to update usage row with:", responseData, officeID, patientKey, responseKey, serviceName, networkType, amount)
        
        const { ServiceDetails } = responseData || []
        const serviceDetailInd = ServiceDetails.findIndex(v => v.ServiceName === serviceName)
        if (!serviceDetailInd) { return }

        const { ServiceName, EligibilityDetails } = ServiceDetails[serviceDetailInd]


        // look for current usage, if any
        const foundRemainingInd = EligibilityDetails.findIndex(v => v.PlanCoverageDescription === networkType && v.EligibilityOrBenefit === "Limitations" && v.TimePeriodQualifier === "Remaining")
        const foundLimitationsInd = EligibilityDetails.findIndex(v => v.PlanCoverageDescription === networkType && v.EligibilityOrBenefit === "Limitations" && v.TimePeriodQualifier !== "Remaining")


        let newEligibilityDetails = [...EligibilityDetails]

        let max = 0
        let qualifier = ''
        if (foundLimitationsInd >= 0) {
            const Limitations = EligibilityDetails[foundLimitationsInd]
            if (Limitations.HealthCareServiceDeliveries) {
                const limits = Limitations.HealthCareServiceDeliveries[0] || {}
                max = limits.TotalQuantity || 0
                qualifier = limits.QuantityQualifier
            }
        }


        if (foundRemainingInd >= 0) {
            const Remaining = EligibilityDetails[foundRemainingInd]
            // handle update
            const newUsageInfoObject = {...Remaining, 
                QuantityAmount: max > 0 ? Math.max(0, Math.min(amount, max)) : amount,
                QuantityQualifier: qualifier
            }
            newEligibilityDetails[foundRemainingInd] = newUsageInfoObject // replace in list
        } else {
            // handle generate then update
            const newUsageInfoObject = {
                EligibilityOrBenefit: "Limitations",
                PlanCoverageDescription: networkType,
                PlanNetworkIndicator: "Yes",
                Procedure: ServiceName,
                TimePeriodQualifier: "Remaining",
                QuantityAmount: max > 0 ? Math.max(0, Math.min(amount, max)) : amount,
                QuantityQualifier: qualifier
            }
            newEligibilityDetails.push(newUsageInfoObject) // push to list  
        }

        console.log("Going to update DB WITH", networkType, newEligibilityDetails)

        const db = getDatabase()
        const responseEligibilityDetailsRef = ref( db, `data/${officeID}/patients_data/${patientKey}/${responseKey}/ServiceDetails/${serviceDetailInd}/EligibilityDetails` )
        return set(responseEligibilityDetailsRef, newEligibilityDetails)
            .then(res => {
                console.log("Updated successfully?", res)
            })
            .catch(err => {
                console.error("Error updating database", err)
            })
    }
    
    static async updateUsageRowAllNetworks(responseData, officeID = "office_00", patientKey, responseKey, serviceName, row, valueOverride = null) {
        console.log("Trying to update usage row with:", responseData, officeID, patientKey, responseKey, serviceName, row)
        
        const { ServiceDetails } = responseData || []
        const serviceDetailInd = ServiceDetails.findIndex(v => v.ServiceName === serviceName)
        if (!serviceDetailInd) { return }

        const { ServiceName, EligibilityDetails } = ServiceDetails[serviceDetailInd]


        // look for current usage, if any
        let newEligibilityDetails = [...EligibilityDetails]
        for (let networkType of NETWORK_TYPES) {
            const nt_key = networkType.toLowerCase().replaceAll(' ', '_')
            
            const amount = valueOverride !== null ? valueOverride : row[nt_key]

            const foundRemainingInd = EligibilityDetails.findIndex(v => v.PlanCoverageDescription === networkType && v.EligibilityOrBenefit === "Limitations" && v.TimePeriodQualifier === "Remaining")
            const foundLimitationsInd = EligibilityDetails.findIndex(v => v.PlanCoverageDescription === networkType && v.EligibilityOrBenefit === "Limitations" && v.TimePeriodQualifier !== "Remaining")


            let max = 0
            let qualifier = ''
            if (foundLimitationsInd >= 0) {
                const Limitations = EligibilityDetails[foundLimitationsInd]
                if (Limitations.HealthCareServiceDeliveries) {
                    const limits = Limitations.HealthCareServiceDeliveries[0] || {}
                    max = limits.TotalQuantity || 0
                    qualifier = limits.QuantityQualifier
                }
            }


            if (foundRemainingInd >= 0) {
                const Remaining = EligibilityDetails[foundRemainingInd]
                // handle update
                const newUsageInfoObject = {...Remaining, 
                    QuantityAmount: max > 0 ? Math.max(0, Math.min(amount, max)) : amount,
                    QuantityQualifier: qualifier
                }
                newEligibilityDetails[foundRemainingInd] = newUsageInfoObject // replace in list
            } else {
                // handle generate then update
                const newUsageInfoObject = {
                    EligibilityOrBenefit: "Limitations",
                    PlanCoverageDescription: networkType,
                    PlanNetworkIndicator: "Yes",
                    Procedure: ServiceName,
                    TimePeriodQualifier: "Remaining",
                    QuantityAmount: max > 0 ? Math.max(0, Math.min(amount, max)) : amount,
                    QuantityQualifier: qualifier
                }
                newEligibilityDetails.push(newUsageInfoObject) // push to list  
            }

        }
        console.log("Going to update DB WITH", newEligibilityDetails)
        const db = getDatabase()
        const responseEligibilityDetailsRef = ref( db, `data/${officeID}/patients_data/${patientKey}/${responseKey}/ServiceDetails/${serviceDetailInd}/EligibilityDetails` )
        return set(responseEligibilityDetailsRef, newEligibilityDetails)
            .then(res => {
                console.log("Updated successfully?", res)
            })
            .catch(err => {
                console.error("Error updating database", err)
            })
    }
}

export default DatabaseAPI