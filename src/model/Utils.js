
export default async function flattenJSONResponse(response) {
    console.log("Got response, editing now")
    const { ServiceDetails } = response // this is our bread and butter for eligibility data
    if (!ServiceDetails || !(ServiceDetails instanceof Array)) { return response  }

    console.log("Looking for 'Others' Service Details")
    const OthersDataInd = ServiceDetails.findIndex(sd => sd.ServiceName === "Others")
    if (OthersDataInd === -1) { return response } // no reason to flatten at this point

    console.log("Mapping 'Services' In Others Data")
    const OthersData = ServiceDetails[OthersDataInd]
    const { EligibilityDetails } = OthersData

    const OthersDataMap = {}
    EligibilityDetails.forEach(ed => {
        // determine its "ServiceName"
        // append
        let edkey = ed.Procedure || 'Plan General'

        let current = OthersDataMap[edkey] || []
        current.push(ed)
        OthersDataMap[edkey] = current
    })

    console.log("Flattening Others' 'Services' To Array")
    const FlattenedOthersServices = Object.keys(OthersDataMap).map(k => {
        return { EligibilityDetails: OthersDataMap[k], ServiceName: k }
    })


    console.log("Merging Flattened Others Data with Rest Of ServiceDetails Array")
    let NewServiceDetails = ServiceDetails.slice()
    NewServiceDetails.splice(OthersDataInd, 1) // NewServiceDetails now does not have "Others" entry
    NewServiceDetails = [...NewServiceDetails, ...FlattenedOthersServices]



    console.log("Returning flattened output!")
    const output = { ...response, ServiceDetails: NewServiceDetails }
    console.log("Flattned output", output)
    return output
}

export const SortingTypes = {
    BY_NETWORK_TYPE: 1,
    BY_BENEFIT_TYPE: 2
}
if (Object.freeze) { Object.freeze(SortingTypes); }

function putInMapAsArray(map, key, value) {
    let current = map[key] || []
    current.push(value)
    map[key] = current
}

function extractBenefitKey(detail, currentKey) {
    let result = currentKey
    if (detail.TimePeriodQualifier) {
        let qualifiers = [detail.TimePeriodQualifier]
        if (detail.QuantityAmount && detail.QuantityQualifier) {
            qualifiers.push(detail.QuantityQualifier)
        }
        result +=  ` (${qualifiers.join(' ')})` 
    }
    return result
}


function extractValue(eligibilityDetail) {
    if (eligibilityDetail.Percent) {
        return `${parseFloat(eligibilityDetail.Percent)*100}%`
    } else if (eligibilityDetail.MonetaryAmount) {
        return `$${parseFloat(eligibilityDetail.MonetaryAmount).toFixed(2)}`
    } else if (eligibilityDetail.QuantityAmount) {
        return eligibilityDetail.QuantityAmount
    } else if (eligibilityDetail.Quantity) {
        return `${eligibilityDetail.Quantity} ${eligibilityDetail.QuantityQualifier}`
    } else if (eligibilityDetail.InsuranceType) {
        return eligibilityDetail.InsuranceType
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

      return deliveries.join(", ")
    } else {
        // console.log("Couldn't extract value?", eligibilityDetail)
    }
    return ''
}

const NetworkTypes = ["IN NETWORK", "OUT OF NETWORK", "OUT OF SERVICE AREA"]

export async function flattenToSortingStyle(eligibilityDetails, sortingType = SortingTypes.BY_BENEFIT_TYPE) {
    let newEligibilityDetails = []

    if (sortingType === SortingTypes.BY_BENEFIT_TYPE) {
        /* Format: {
            benefit: string,
            editable: boolean,
            in_network: any,
            out_of_network: any,
            out_of_service_area: any,
            messages: array<any>
        } */
        let mappedToBenefits = {}
        eligibilityDetails.forEach(v => {
            let key = extractBenefitKey(v, v.EligibilityOrBenefit)
            putInMapAsArray(mappedToBenefits, key, v)
        })

        Object.keys(mappedToBenefits).forEach(key => {
            
            let row = {
                benefit: key,
                editable: key === 'Limitations (Remaining Visits)',
                editable_cells: ['in_network', 'out_of_network', 'out_of_service_area'],
                raw: {}
            }
            mappedToBenefits[key].forEach(detail => {
                if (!detail.PlanCoverageDescription) {
                    console.log(detail)
                    row = {
                        ...row,
                        coverage: detail.CoverageLevel || '',
                        indicator: detail.PlanNetworkIndicator || '',
                        authorization: detail.AuthorizationOrCertificationRequired || '',
                        messages: detail.Message
                    }
                    NetworkTypes.forEach(ntkey => {
                        row[ntkey] = ''
                        row.raw[ntkey] = ''
                    })
                } else {
                    const networkKey = detail.PlanCoverageDescription.toLowerCase().replaceAll(' ', '_')
                    row = {
                        ...row,
                        coverage: detail.CoverageLevel || '',
                        indicator: detail.PlanNetworkIndicator || '',
                        authorization: detail.AuthorizationOrCertificationRequired || '',
                        messages: detail.Message
                    }
                    row[networkKey] = extractValue(detail)
                    row.raw[networkKey] = detail
                }
            })
            newEligibilityDetails.push(row)
        })
    } else {
        /* Format: {
            network: string,
            editable: boolean,
            benefit: any, <- expect 3 benefits per network, generally
            value: any,
            message: Array<any>
        } */
        let mappedToNetwork = {}
        eligibilityDetails.forEach(v => {
            if (v.PlanCoverageDescription) {
                putInMapAsArray(mappedToNetwork, v.PlanCoverageDescription, v)
            } else {
                NetworkTypes.forEach(nt => putInMapAsArray(mappedToNetwork, nt, v))
            }
        })

        
        Object.keys(mappedToNetwork).forEach(key => {
            mappedToNetwork[key].forEach(detail => {
                // convert to format
                let benefit = extractBenefitKey(detail, detail.EligibilityOrBenefit)
                const row = {
                    network: key,
                    editable: benefit === 'Limitations (Remaining Visits)',
                    editable_cells: ['value'],
                    benefit: benefit,
                    coverage: detail.CoverageLevel || '',
                    indicator: detail.PlanNetworkIndicator,
                    authorization: detail.AuthorizationOrCertificationRequired,
                    raw: detail,
                    value: extractValue(detail), // varies
                    messages: detail.Message
                }
                newEligibilityDetails.push(row)
            })
        })
    }

    return newEligibilityDetails
}