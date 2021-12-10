import dayjs from "dayjs";
import React from "react";
import "./ListItemPatient.scss";

/** Handles rendering a patient list item within a larger list. */
function ListItemPatient({ item, onClick = () => {} }) {
  const { lastRequestTime, lastRequestID, patientName, patientDOB, patientMemberID } = item.val;

  // create formatted time to display
  const lastTimeRequested = dayjs(lastRequestTime).format('YYYY-MM-DD HH:mm:ss') 

  // RENDER
  return (
    <div className="list-item-patient" onClick={onClick}>
      <div className="row">
        <h2>{patientName}</h2>
        <h3>Member ID #{patientMemberID}</h3>
      </div>
      <div className="row">
        <b>DOB:</b> {patientDOB}
      </div>

      <div className="row">
        <b>Last Request At:</b> {lastTimeRequested.toString()}
      </div>
      <div className="row">
        <b>Last Request ID:</b> {lastRequestID}
      </div>
    </div>
  );
}

export default ListItemPatient;
