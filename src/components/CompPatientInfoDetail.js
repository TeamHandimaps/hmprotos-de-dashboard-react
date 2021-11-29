import React from "react";
import "./CompPatientInfoDetail.scss";
import { getDatabase, ref, off, onValue } from "firebase/database";
import CompResponseDataRawOverlay from "./CompResponseDataRawOverlay";
import IFrame from "./UtilReactIFrame.js";
// import CompActivePatientPlanModification from "./CompActivePatientPlanModification";
import CompPatientActivePlanEditingTable from './CompPatientActivePlanEditingTable'

function CompPatientInfoDetail({ item, officeID = "office_00", onBack = () => {} }) {
  const [loading, setLoading] = React.useState(true);
  const [editing, setEditing] = React.useState(false);
  const [requests, setRequests] = React.useState([]);
  // const [activeRequestID, setActiveRequestID] = React.useState('none')
  const [selectedResponse, setSelectedResponse] = React.useState({});
  const [openOverlay, setOpenOverlay] = React.useState(false);
  const { patientName /*,  lastRequestTime, lastRequestID,  patientDOB, patientMemberID  */ } = item.val;

  const onErrorHandler = (err) => {
    console.error("Database Error:", err);
  };

  React.useEffect(() => {
    const patientsRef = ref(getDatabase(), `data/${officeID}/patients_data/${item.key}`);

    const handlePatientsSnapshot = (snap) => {
      let items = [];
      snap.forEach((child) => {
        items.push({ key: child.key, val: child.val() });
      });
      const getTime = (item) => new Date(item.val.timestamp).getTime();
      items.sort((a, b) => getTime(b) - getTime(a));
      setRequests(items);
      setLoading(false);
    };

    onValue(patientsRef, handlePatientsSnapshot, onErrorHandler);

    return () => off(patientsRef);
  }, [officeID, item.key]);

  const handleOpenRawDataOverlay = (responseData) => {
    setSelectedResponse(responseData);
    setOpenOverlay(true);
  };

  const requestsList = requests.map((v) => {
    const { key, val } = v;
    const { PayerName, PverifyPayerCode, DentalInfo, APIResponseMessage, timestamp } = val;

    let content = null;
    if (!DentalInfo) {
      content = '<div class="response-html-error">' + APIResponseMessage + "</div>";
    } else {
      content = DentalInfo;
    }

    const time = new Date(timestamp).toLocaleDateString("en-US", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });

    let openResponseDataButton = <button onClick={() => handleOpenRawDataOverlay(v)}>Open Raw Response Data</button>;
    if (!DentalInfo) {
      openResponseDataButton = <button disabled>Open Raw Response Data</button>;
    }

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

  let content = (<>
    <h2>Verification Request History</h2>
    {loading ? <h2 id='loading-label'>Loading Recent Requests For Patient...</h2> : null}
    <div className='requests-list'>{requestsList}</div>
  </>);

  if (editing) {
    content = (<>
      <h2>Edit Usage Data For Patient Active Plan</h2>
      <CompPatientActivePlanEditingTable patientID={item.key}/>
    </>)
  }

  return (
    <div className='component-patient-info-detail'>
      <div className='header'>
        <div className='header-left'>
          <button onClick={onBack}>Back</button>
        </div>
        <div className='header-center'>
          <h1>Patient Info Detail:</h1> <h2>{patientName}</h2>
        </div>
        <span className='header-right' />
      </div>
      <div className="subheader"><button onClick={() => setEditing(!editing)}>{editing ? "View Request History" : "Edit Active Plan Usage"}</button></div>
      {content}
      {openOverlay ? (
        <CompResponseDataRawOverlay
          response={selectedResponse}
          onClose={() => {
            setOpenOverlay(false);
          }}
        />
      ) : null}
    </div>
  );
}

export default CompPatientInfoDetail;
