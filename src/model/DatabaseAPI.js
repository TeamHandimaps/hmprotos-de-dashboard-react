import { getDatabase, ref, set } from "firebase/database"

class DatabaseAPI {
    static updateUsageInfo(officeID = "office_00", patientKey, responseData, benefitData, networkType, amount) {
        const { key, val } = responseData
        if (!key || !val) { return }

        const { ServiceDetails } = val || []
        const [ benefitKey, parentInd, childInd, data, usage] = benefitData

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
                QuantityAmount: amount,
            }
            newEligibilityDetails.push(newUsageInfoObject) // push to list
        }
        console.log("Going to update database with", newEligibilityDetails)



        const db = getDatabase()
        const responseEligibilityDetailsRef = ref( db, `data/${officeID}/patients_data/${patientKey}/${key}/ServiceDetails/${parentInd}/EligibilityDetails` )
        console.log("Using response ref?", responseEligibilityDetailsRef.toString())
        set(responseEligibilityDetailsRef, newEligibilityDetails)
            .then(res => {
                console.log("Updated successfully?", res)
            })
            .catch(err => {
                console.error("Error updating database", err)
            })

    }
}

export default DatabaseAPI