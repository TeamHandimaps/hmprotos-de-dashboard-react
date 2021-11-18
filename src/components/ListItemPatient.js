import React from "react";
import "./ListItemPatient.scss";

function ListItemPatient({ item, onClick = () => {} }) {
  const { lastRequestTime, lastRequestID, patientName, patientDOB, patientMemberID } = item.val;

  const lastTimeRequested = new Date(lastRequestTime).toLocaleDateString("en-US", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className='list-item-patient' onClick={onClick}>
      <div className='row'>
        <h2>{patientName}</h2>
        <h3>Member ID #{patientMemberID}</h3>
      </div>
      <div className='row'>
        <b>DOB:</b> {patientDOB}
      </div>

      <div className='row'>
        <b>Last Request At:</b> {lastTimeRequested.toString()}
      </div>
      <div className='row'>
        <b>Last Request ID:</b> {lastRequestID}
      </div>
    </div>
  );
}

export default ListItemPatient;
