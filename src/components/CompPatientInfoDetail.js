import React from "react";
import dayjs from "dayjs";
import { getDatabase, ref, off, onValue } from "firebase/database";

import "./CompPatientInfoDetail.scss";

import CompPatientActivePlanEditor from "./CompPatientActivePlanEditor";
import UtilRawResponseCustomDataTable from "./UtilRawResponseCustomDataTable";
import IFrame from "./UtilReactIFrame.js";

import { useAuth } from "../context/AuthContext";
import UtilOverlay from "./UtilOverlay";
import { useLocation, useNavigate } from "react-router-dom";

/** Component to handle rendering the patient info detail page. */
function CompPatientInfoDetail({ item = null }) {
  const navigation = useNavigate();
  const {
    state: { patient },
  } = useLocation();

  const patientToUse = item || patient;

  const {
    user: { office },
  } = useAuth();

  const [loading, setLoading] = React.useState(true);
  const [editing, setEditing] = React.useState(false);
  const [requests, setRequests] = React.useState([]);
  const [selectedResponse, setSelectedResponse] = React.useState({});
  const [openOverlay, setOpenOverlay] = React.useState(false);

  const { patientName /*,  lastRequestTime, lastRequestID,  patientDOB, patientMemberID  */ } = patientToUse.val;

  React.useEffect(() => {
    const patientsRef = ref(getDatabase(), `data/${office}/patients_data/${patientToUse.key}`);

    // get patients response data
    const handlePatientsSnapshot = (snap) => {
      let items = [];
      snap.forEach((child) => {
        // make sure to record every response we have
        items.push({ key: child.key, val: child.val() });
      });
      // sort by time requested
      const getTime = (item) => dayjs(item.val.timestamp).valueOf();
      items.sort((a, b) => getTime(b) - getTime(a));
      // set data
      setRequests(items);
      setLoading(false);
    };

    onValue(patientsRef, handlePatientsSnapshot, (err) => console.error("Database Error", err));

    return () => off(patientsRef);
  }, [office, patientToUse.key]);

  /** Handles opening the overlay with the selected response. */
  const handleOpenRawDataOverlay = (responseData) => {
    setSelectedResponse(responseData);
    setOpenOverlay(true);
  };

  // create requests list to render
  const requestsList = requests.map((v) => {
    const { key, val } = v;
    const { PayerName, PverifyPayerCode, DentalInfo, APIResponseMessage, timestamp } = val;

    // determine content to show in preview
    let content = null;
    if (!DentalInfo) {
      content = '<div class="response-html-error">' + APIResponseMessage + "</div>";
    } else {
      content = DentalInfo;
    }

    // determine time to display
    const time = dayjs(timestamp).format("YYYY-MM-DD HH:mm:ss");

    // determine what kind of button to show (we don't want to even provide the on-click functionality if the button is disabled ?)
    let openResponseDataButton = <button onClick={() => handleOpenRawDataOverlay(v)}>Open Raw Response Data</button>;
    if (!DentalInfo) {
      openResponseDataButton = <button disabled>Open Raw Response Data</button>;
    }

    // render the request preview
    return (
      <details key={key}>
        <summary className={DentalInfo ? "success" : "failure"}>
          <p>
            Request: {PayerName} ({PverifyPayerCode}) - {time}
          </p>
          {openResponseDataButton}
        </summary>
        <div className='detail-content'>
          <IFrame content={content} wrap={!DentalInfo} />
        </div>
      </details>
    );
  });

  // RENDER
  return (
    <div className='component-patient-info-detail'>
      <div className='header'>
        <div className='header-left'>
          <button onClick={() => navigation(-1)}>Back</button>
        </div>
        <div className='header-center'>
          <h1>Patient Info Detail:</h1> <h2>{patientName}</h2>
        </div>
        <span className='header-right' />
      </div>
      <div className='subheader'>
        <button onClick={() => setEditing(!editing)}>
          {editing ? "View Request History" : "Edit Active Plan Usage"}
        </button>
      </div>
      {editing ? (
        <>
          <h2>Edit Usage Data For Patient Active Plan</h2>
          <CompPatientActivePlanEditor patientID={patientToUse.key} />
        </>
      ) : (
        <>
          <h2>Verification Request History</h2>
          {loading ? <h2 id='loading-label'>Loading Recent Requests For Patient...</h2> : null}
          <div className='requests-list'>{requestsList}</div>
        </>
      )}
      {openOverlay ? (
        <UtilOverlay onClose={() => setOpenOverlay(false)}>
          <UtilRawResponseCustomDataTable response={selectedResponse} />
        </UtilOverlay>
      ) : null}
    </div>
  );
}

export default CompPatientInfoDetail;
