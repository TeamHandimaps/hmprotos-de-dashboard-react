import React from "react";
import "./CompVerificationList.scss";

import ListItemPatient from "./ListItemPatient";

import { getDatabase, ref, off, onValue } from "firebase/database";

function CompVerificationList({ officeID = "office_00" }) {
  const [patients, setPatients] = React.useState([]);

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

  return (
    <div className='component-verification-list'>
      <h1>Verified Patient List</h1>
      {patients.map((item) => (
        <ListItemPatient key={item.key} item={item} />
      ))}
    </div>
  );
}

export default CompVerificationList;
