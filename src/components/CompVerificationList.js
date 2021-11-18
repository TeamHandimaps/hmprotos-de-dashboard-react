import React from "react";
import "./CompVerificationList.scss";

import ListItemPatient from "./ListItemPatient";

import { getDatabase, ref, off, onValue } from "firebase/database";
import CompPatientInfoDetail from "./CompPatientInfoDetail";

function CompVerificationList({ officeID = "office_00" }) {
  const [patients, setPatients] = React.useState([]);
  const [selectedPatient, setSelectedPatient] = React.useState({});
  const [detailOpen, setDetailOpen] = React.useState(false);

  const onErrorHandler = (err) => {
    console.error("Database Error:", err);
  };

  React.useEffect(() => {
    const patientsRef = ref(getDatabase(), `data/${officeID}/patients`);

    const handlePatientsSnapshot = (snap) => {
      let items = [];
      snap.forEach((snap) => {
        items.push({ key: snap.key, val: snap.val() });
      });
      setPatients(items);
    };

    onValue(patientsRef, handlePatientsSnapshot, onErrorHandler);

    return () => off(patientsRef);
  }, [officeID]);

  if (detailOpen) {
    const handleOnBack = () => setDetailOpen(false);
    return <CompPatientInfoDetail item={selectedPatient} onBack={handleOnBack} />;
  }

  const patientList = patients.map((item) => {
    const handleItemOnClick = () => {
      console.log("Setting selected");
      setSelectedPatient(item);
      setDetailOpen(true);
    };
    return <ListItemPatient key={item.key} item={item} onClick={handleItemOnClick} />;
  });

  return (
    <div className='component-verification-list'>
      <h1>Verified Patient List</h1>
      {patientList}
    </div>
  );
}

export default CompVerificationList;
