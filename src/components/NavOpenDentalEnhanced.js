import React, { useEffect, useReducer, useRef, useState } from "react";
import axios from "axios";
import Queries from "../model/OpenDentalQueries";
import "./NavOpenDentalEnhanced.scss";
import dayjs from "dayjs";

/**
 * Helper method to run data through an endpoint (and request type) via a defacto private-proxy.
 *
 * @param {*} endpoint Endpoint to request at.
 * @param {*} data The data to include in the body of the request.
 * @param {*} type The type of request (GET, POST, PUT, etc)
 * @returns A promise that will return either an error object or the response object.
 */
const runThruProxy = async (endpoint, type, data) => {
  // this is ALWAYS the proxy url for the time being
  // TODO: Put this somewhere else ? .env ?
  const proxyurl = "https://hm-protos-de-odi.herokuapp.com/odgeneric";

  return await axios
    .post(proxyurl, {
      od_method: type,
      od_endpoint: endpoint,
      od_data: data,
    })
    .then((response) => response.data.data || response.data);
};

/**
 * This will run the specified query (via proxy).
 *
 * @param {*} query
 * @returns
 */
const runQuery = async (query) => {
  return runThruProxy("queries/ShortQuery", "PUT", { SqlCommand: query }).catch((err) => {
    console.error("Error running queries/ShortQuery", err);
    return [];
  });
};

/**
 * Easy command for refreshing all data.
 * 
 * @param {*} loadingCallback Callback for status/loading stage updates.
 * @returns Object containing all data at known keys.
 */
const getAllData = async (loadingCallback = (stage) => {}) => {
  console.log("Starting full data pull!");
  loadingCallback(0);

  const patients = (await runThruProxy("patients?Offset=0", "GET", {})).catch(() => []) || [];
  console.log("\tGot Patients Data!", patients.length);
  loadingCallback(1);

  const insPlans = (await runQuery(Queries.GrabAllInsurancePlans)) || [];
  console.log("\tGot Insurance Plans Data!", insPlans.length);
  loadingCallback(2);

  const patPlanLinks = (await runQuery(Queries.GrabAllPatientSubscriberLinks)) || [];
  console.log("\tGot Patient-Subscriber-Plan Links Data!", patPlanLinks.length);
  loadingCallback(3);

  const insSubLinks = (await runQuery(Queries.GrabAllInsuranceSubscriberLinks)) || [];
  console.log("\tGot Subscriber-Plan Links Data!", insSubLinks.length);
  loadingCallback(4);

  const insAdjustments = (await runQuery(Queries.GrabAllInsuranceForPatient)) || [];
  console.log("\tGot Insurance Adjustments Data!", insAdjustments.length);
  loadingCallback(5);

  console.log("Finished initial data load!");

  return { patients, insPlans, patPlanLinks, insSubLinks, insAdjustments };
};

const reduceStatusState = (state, action) => {
  return { ...state, [action.type]: action.status };
};
/** A more user-friendly version of the open dental demo. */
function NavOpenDentalEnhanced() {
  const mounted = useRef(false);
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState(-1);

  const [status, statusDispatch] = useReducer(reduceStatusState, {
    create_inssub: 0,
    create_patplan: 0,
    create_bv_insplan: 0,
    create_bv_patplan: 0,
    create_adj_ins: 0,
    create_adj_ded: 0,
    del_inssub: 0,
    del_patplan: 0,
  });

  const [data, setData] = useState({
    patients: [],
    insPlans: [],
    patPlanLinks: [],
    insSubLinks: [],
    insAdjustments: [],
  });

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  });

  useEffect(() => {
    (function () {
      if (stage !== -1) {
        return;
      }
      if (mounted.current) {
        setLoading(true);
      }
      getAllData((stage) => {
        if (mounted.current) {
          setStage(stage);
        }
      }).then((result) => {
        if (mounted.current) {
          setLoading(false);
          setData(result);
        }
      });
    })();
  }, [stage]);

  const shouldBeOpen = false;

  /** handles refreshing all data, since we aren't using sockets. */
  const handleRefreshData = (evt) => {
    if (loading) {
      console.log("Can't refresh data, loading in progress");
      return;
    }
    if (mounted.current) {
      setLoading(true);
    }
    getAllData((stage) => {
      if (mounted.current) {
        setStage(stage);
      }
    }).then((result) => {
      if (mounted.current) {
        setLoading(false);
        setData(result);
      }
    });
  };

  /** Handler for creating an insurance plan - subscriber link. */
  const handleImage4CreateNewInsuranceSubscriberLink = (evt) => {
    evt.preventDefault();

    console.log(evt.target.insplannum.value, evt.target.patnum.value);

    runThruProxy("inssubs", "POST", {
      PlanNum: evt.target.insplannum.value,
      Subscriber: evt.target.patnum.value,
      DateEffective: "2022-01-31",
      DateTerm: "2022-12-31",
      SubscriberID: "1234567",
      BenefitNotes: "API Created Benefit Notes",
    })
      .then((res) => {
        console.log("Link Subscriber To Insurance Plan (Image #4)", res);
        statusDispatch({ type: "create_inssub", status: 1 });
      })
      .catch((err) => {
        console.error("Unable to create inssub", err);
        statusDispatch({ type: "create_inssub", status: -1 });
      });
  };
  /** Handler for creating a patient-subscriber-insurance plan link. */
  const handleImage4CreateNewPatientSubscriberLink = (evt) => {
    evt.preventDefault();

    console.log(evt.target.patnum.value, evt.target.inssubnum.value);

    runThruProxy("patplans", "POST", {
      PatNum: evt.target.patnum.value,
      Relationship: "Self",
      InsSubNum: evt.target.inssubnum.value,
    })
      .then((res) => {
        console.log("Result from Create Patient-Subscriber(-Plan) Link", res);
        statusDispatch({ type: "create_patplan", status: 1 });
      })
      .catch((err) => {
        console.error("Unable to create patplan", err);
        statusDispatch({ type: "create_patplan", status: -1 });
      });
  };

  /** Handler for creating a notice of insurance verification for a patient. */
  const handleImage4CreateNewBenefitsVerificationInsPlan = (evt) => {
    evt.preventDefault();

    console.log(evt.target.date.value, evt.target.insplannum.value);

    if (!evt.target.date.value) {
      console.log("no date");
      return;
    }

    runThruProxy("insverifies", "PUT", {
      DateLastVerified: dayjs(evt.target.date.value).format("YYYY-MM-DD"),
      VerifyType: "InsuranceBenefit",
      FKey: evt.target.insplannum.value,
      // "DefNum": 721,
    })
      .then((res) => {
        console.log("Result for Create Notice Of Benefits Verification (InsPlanNum) (Image #4)", res);
        statusDispatch({ type: "create_bv_insplan", status: 1 });
      })
      .catch((err) => {
        console.error("Unable to create bv (insplan)", err);
        statusDispatch({ type: "create_bv_insplan", status: -1 });
      });
  };

  /** Handler for creating a notice of insurance verification for a patient. */
  const handleImage4CreateNewBenefitsVerificationPatPlanNum = (evt) => {
    evt.preventDefault();

    console.log(evt.target.date.value, evt.target.patplannum.value);

    if (!evt.target.date.value) {
      console.log("no date");
      return;
    }

    runThruProxy("insverifies", "PUT", {
      DateLastVerified: dayjs(evt.target.date.value).format("YYYY-MM-DD"),
      VerifyType: "PatientEnrollment",
      FKey: evt.target.patplannum.value,
      // "DefNum": 721,
    })
      .then((res) => {
        console.log("Result for Create Notice Of Benefits Verification (PatPlanNum) (Image #4)", res);
        statusDispatch({ type: "create_bv_patplan", status: 1 });
      })
      .catch((err) => {
        console.error("Unable to create bv (patplan)", err);
        statusDispatch({ type: "create_bv_patplan", status: -1 });
      });
  };

  /** Handler for creating a new insurance adjustment for a patient. */
  const handleImage5CreateNewInsuranceAdjustment_Insurance = (evt) => {
    evt.preventDefault();

    console.log(evt.target.date.value, evt.target.insamount.value, evt.target.patplannum.value);

    if (!evt.target.date.value || !evt.target.insamount.value) {
      return;
    }

    runThruProxy("claimprocs/InsAdjust", "PUT", {
      PatPlanNum: evt.target.patplannum.value,
      date: dayjs(evt.target.date.value).format("YYYY-MM-DD"),
      insUsed: evt.target.insamount.value,
    })
      .then((res) => {
        console.log("Result for Create Insurance Adjustments (Insurance Usage) (Image #5)", res);
        statusDispatch({ type: "create_adj_ins", status: 1 });
      })
      .catch((err) => {
        console.error("Unable to create adjust (ins)", err);
        statusDispatch({ type: "create_adj_ins", status: -1 });
      });
  };

  /** Handler for creating a new insurance adjustment for a patient. */
  const handleImage5CreateNewInsuranceAdjustment_Deductible = (evt) => {
    evt.preventDefault();

    console.log(evt.target.date.value, evt.target.dedamount.value, evt.target.patplannum.value);

    if (!evt.target.date.value || !evt.target.dedamount.value) {
      return;
    }

    runThruProxy("claimprocs/InsAdjust", "PUT", {
      PatPlanNum: evt.target.patplannum.value,
      date: dayjs(evt.target.date.value).format("YYYY-MM-DD"),
      deductibleUsed: evt.target.dedamount.value,
    })
      .then((res) => {
        console.log("Result for Create Insurance Adjustments (Deductible  Usage) (Image #5)", res);
        statusDispatch({ type: "create_adj_ded", status: 1 });
      })
      .catch((err) => {
        console.error("Unable to create adjust (ded)", err);
        statusDispatch({ type: "create_adj_ded", status: -1 });
      });
  };

  const handleDeleteInsSub = (evt) => {
    evt.preventDefault();

    runThruProxy("inssubs/" + evt.target.inssubnum.value, "DELETE", {})
      .then((res) => {
        console.log("Result for Delete Subscriber-Insurance Plan Link", res);
        statusDispatch({ type: "del_inssub", status: 1 });
      })
      .catch((err) => {
        console.error("Unable to delete inssub)", err);
        statusDispatch({ type: "del_inssub", status: -1 });
      });
  };

  const handleDeletePatPlan = (evt) => {
    evt.preventDefault();

    runThruProxy("patplans/" + evt.target.patplannum.value, "DELETE", {})
      .then((res) => {
        console.log("Result for Delete Patient-Subscriber(-Insurance Plan) Link", res);
        statusDispatch({ type: "del_patplan", status: 1 });
      })
      .catch((err) => {
        console.error("Unable to delete patplan", err);
        statusDispatch({ type: "del_patplan", status: -1 });
      });
  };

  let loadingText = "Loading...";

  if (!loading) {
    if (stage === 5) {
      loadingText = "[100%] Loading Finished!";
    } else {
      loadingText = "[  0%] Waiting For Initial Load...";
    }
  } else {
    if (stage === 5) {
      loadingText = "[100%] Loading Finished!";
    } else if (stage === 4) {
      loadingText = "[ 80%] Loading Insurance Adjustments...";
    } else if (stage === 3) {
      loadingText = "[ 60%] Loading Subscriber-Plan Links...";
    } else if (stage === 2) {
      loadingText = "[ 40%] Loading Patient-Subscriber Links...";
    } else if (stage === 1) {
      loadingText = "[ 20%] Loading Insurance Plans...";
    } else if (stage === 0) {
      loadingText = "[  0%] Loading Patients...";
    } else {
      loadingText = "[???%] Loading...?";
    }
  }

  /** Helper to help display status label on status change for a specific command. */
  const StatusLabel = ({ statusCode }) => {
    let label = "";
    let color = "grey";
    if (statusCode === -1) {
      color = "red";
      label = "Last Command Status: Unsuccessful";
    } else if (statusCode === 1) {
      color = "green";
      label = "Last Command Status: Successful";
    }

    return (
      <p className='status-label' style={{ color: color }}>
        {label}
      </p>
    );
  };

  return (
    <div className='nav-open-dental-enhanced'>
      <h1>Open Dental Data Visualized</h1>
      <h2>{loadingText}</h2>

      <div className='section'>
        <h2>Perform [CREATE] Actions</h2>

        <details open={shouldBeOpen}>
          <summary>
            <div>
              Link Subscriber To Insurance Plan (Image #4) <StatusLabel statusCode={status.create_inssub} />
            </div>
          </summary>
          <form className='interaction-block' onSubmit={handleImage4CreateNewInsuranceSubscriberLink}>
            <label>
              Patient Num (Subscriber)
              <select name='patnum'>
                {data.patients.map((v) => (
                  <option key={v.PatNum}>{v.PatNum}</option>
                ))}
              </select>
            </label>

            <label>
              Insurance Plan Num
              <select name='insplannum'>
                {data.insPlans.map((v) => (
                  <option key={v.PlanNum}>{v.PlanNum}</option>
                ))}
              </select>
            </label>

            <h3>Create Subscriber-Plan Link</h3>
            <button type='submit'>Create Subscriber-Plan Link</button>
          </form>
        </details>

        <details open={shouldBeOpen}>
          <summary>
            <div>
              Link Patient To Subscriber (To InsPlan) (Image #4 - Implied){" "}
              <StatusLabel statusCode={status.create_patplan} />
            </div>
          </summary>
          <form className='interaction-block' onSubmit={handleImage4CreateNewPatientSubscriberLink}>
            <label>
              Patient Num (Dependent OR Subscriber Themselves)
              <select name='patnum'>
                {data.patients.map((v) => (
                  <option key={v.PatNum}>{v.PatNum}</option>
                ))}
              </select>
            </label>

            <label>
              InsSub Num
              <select name='inssubnum'>
                {data.insSubLinks.map((v) => (
                  <option key={v.InsSubNum}>{v.InsSubNum}</option>
                ))}
              </select>
            </label>

            <h3>Create Patient-Subscriber(-Plan) Link</h3>
            <button type='submit'>Create Patient-Subscriber(-Plan) Link</button>
          </form>
        </details>

        <details open={shouldBeOpen}>
          <summary>
            <div>
              Create Notice Of Benefits Verification (InsPlanNum) (Image #4){" "}
              <StatusLabel statusCode={status.create_bv_insplan} />
            </div>
          </summary>
          <form className='interaction-block' onSubmit={handleImage4CreateNewBenefitsVerificationInsPlan}>
            <label>
              Date Last Verified
              <input name='date' type='date' />
            </label>

            <label>
              Insurance Plan Num
              <select name='insplannum'>
                {data.insPlans.map((v) => (
                  <option key={v.PlanNum}>{v.PlanNum}</option>
                ))}
              </select>
            </label>

            <h3>Create Notice of Benefits Verification</h3>
            <button type='submit'>Create Notice of Benefits Verification</button>
          </form>
        </details>

        <details open={shouldBeOpen}>
          <summary>
            <div>
              Create Notice Of Benefits Verification (PatPlanNum) (Image #4){" "}
              <StatusLabel statusCode={status.create_bv_patplan} />
            </div>
          </summary>
          <form className='interaction-block' onSubmit={handleImage4CreateNewBenefitsVerificationPatPlanNum}>
            <label>
              Date Last Verified
              <input name='date' type='date' />
            </label>

            <label>
              Pat Plan Num
              <select name='patplannum'>
                {data.patPlanLinks.map((v) => (
                  <option key={v.PatPlanNum}>{v.PatPlanNum}</option>
                ))}
              </select>
            </label>

            <h3>Create Notice of Benefits Verification</h3>
            <button type='submit'>Create Notice of Benefits Verification</button>
          </form>
        </details>

        <details open={shouldBeOpen}>
          <summary>
            <div>
              Create Insurance Adjustments (Insurance Usage) (Image #5){" "}
              <StatusLabel statusCode={status.create_adj_ins} />
            </div>
          </summary>
          <form className='interaction-block' onSubmit={handleImage5CreateNewInsuranceAdjustment_Insurance}>
            <label>
              PatPlan Num
              <select name='patplannum'>
                {data.patPlanLinks.map((v) => (
                  <option key={v.PatPlanNum}>{v.PatPlanNum}</option>
                ))}
              </select>
            </label>
            <label>
              Date
              <input name='date' type='date' />
            </label>
            <label>
              Insurance Used ($)
              <input name='insamount' type='number' />
            </label>
            <button type='submit'>Create Insurance Adjustment</button>
          </form>
        </details>

        <details open={shouldBeOpen}>
          <summary>
            <div>
              Create Insurance Adjustments (Deductible Usage) (Image #5){" "}
              <StatusLabel statusCode={status.create_adj_ded} />
            </div>
          </summary>
          <form className='interaction-block' onSubmit={handleImage5CreateNewInsuranceAdjustment_Deductible}>
            <label>
              PatPlan Num
              <select name='patplannum'>
                {data.patPlanLinks.map((v) => (
                  <option key={v.PatPlanNum}>{v.PatPlanNum}</option>
                ))}
              </select>
            </label>
            <label>
              Date
              <input name='date' type='date' />
            </label>
            <label>
              Deductible Used ($)
              <input name='dedamount' type='number' />
            </label>
            <button type='submit'>Create Insurance Adjustment</button>
          </form>
        </details>

        <h2>Perform [DELETE] Actions</h2>

        <details open={shouldBeOpen}>
          <summary>
            <div>
              Delete Subscriber-Insurance Plan Link <StatusLabel statusCode={status.del_inssub} />
            </div>
          </summary>
          <form className='interaction-block' onSubmit={handleDeleteInsSub}>
            <label>
              InsSub Num
              <select name='inssubnum'>
                {data.insSubLinks.map((v) => (
                  <option key={v.InsSubNum}>{v.InsSubNum}</option>
                ))}
              </select>
            </label>
            <button type='submit'>Delete Subscriber-Insurance Plan Link</button>
          </form>
        </details>

        <details open={shouldBeOpen}>
          <summary>
            <div>
              Delete Patient-Subscriber(-Insurance Plan) Link <StatusLabel statusCode={status.del_patplan} />
            </div>
          </summary>
          <form className='interaction-block' onSubmit={handleDeletePatPlan}>
            <label>
              PatPlan Num
              <select name='patplannum'>
                {data.patPlanLinks.map((v) => (
                  <option key={v.PatPlanNum}>{v.PatPlanNum}</option>
                ))}
              </select>
            </label>
            <button type='submit'>Delete Patient-Subscriber(-Insurance Plan) Link</button>
          </form>
        </details>

        {loading && <div className='loading-overlay' />}
      </div>

      <div className='section'>
        <h2>
          View Data
          <button disabled={loading} onClick={handleRefreshData} style={{ marginLeft: "16px" }}>
            Refresh All Data
          </button>
        </h2>
        <details open={shouldBeOpen}>
          <summary>Patients</summary>
          <Table
            columns={[
              "PatNum",
              "LName",
              "FName",
              "PatStatus",
              "Birthdate",
              "Address",
              "City",
              "State",
              "PriProv",
              "priProvAbbr",
            ]}
            items={data.patients}
          />
        </details>

        <details open={shouldBeOpen}>
          <summary>Insurance Plans</summary>
          <Table
            columns={["PlanNum", "PlanType", "EmployerNum", "CarrierNum", "GroupNum", "GroupName"]}
            items={data.insPlans}
          />
        </details>

        <details open={shouldBeOpen}>
          <summary>Insurance-Subscriber Links</summary>
          <Table
            columns={["InsSubNum", "PlanNum", "Subscriber", "SubscriberID", "DateEffective", "DateTerm"]}
            items={data.insSubLinks}
          />
        </details>

        <details open={shouldBeOpen}>
          <summary>Patient-Subscriber-(Plan) Links</summary>
          <Table columns={["PatPlanNum", "InsSubNum", "PatNum", "Relationship", "Ordinal"]} items={data.patPlanLinks} />
        </details>

        <details open={shouldBeOpen}>
          <summary>Insurance Adjustments</summary>
          <Table
            columns={[
              "ClaimProcNum",
              "ProcNum",
              "ClaimNum",
              "PatNum",
              "InsPayEst",
              "InsEstTotal",
              "InsPayAmt",
              "CopayAmt",
            ]}
            items={data.insAdjustments}
          />
        </details>

        <details>
          <summary>Raw Data</summary>
          {JSON.stringify(data)}
        </details>

        {loading && <div className='loading-overlay' />}
      </div>
    </div>
  );
}

export default NavOpenDentalEnhanced;

function Table({ columns, items = [] }) {
  const rows = items.map((item, index) => {
    return (
      <tr key={index}>
        {columns.map((key, colInd) => (
          <td key={`${index}-${colInd}-${key}`}>{item[key]}</td>
        ))}
      </tr>
    );
  });

  return (
    <table>
      <thead>
        <tr>
          {columns.map((v) => (
            <th key={v}>{v}</th>
          ))}
        </tr>
      </thead>
      <tbody>{rows}</tbody>
    </table>
  );
}
