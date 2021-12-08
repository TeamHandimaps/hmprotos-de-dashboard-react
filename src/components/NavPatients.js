import React from "react";
import "./NavPatients.scss";

import ListItemPatient from "./ListItemPatient";

import { getDatabase, ref, off, onValue } from "firebase/database";
import CompPatientInfoDetail from "./CompPatientInfoDetail";

function NavPatients({ officeID = "office_00" }) {
  const [loading, setLoading] = React.useState(true)
  const [patients, setPatients] = React.useState([]);
  const [selectedPatient, setSelectedPatient] = React.useState({});
  const [detailOpen, setDetailOpen] = React.useState(false);

  const onErrorHandler = (err) => {
    console.error("Database Error:", err);
    setLoading(false)
  };

  React.useEffect(() => {
    const patientsRef = ref(getDatabase(), `data/${officeID}/patients`);

    const handlePatientsSnapshot = (snap) => {
      let items = [];
      snap.forEach((child) => {
        items.push({ key: child.key, val: child.val() });
      });
      setPatients(items);
      setLoading(false)
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
      setSelectedPatient(item);
      setDetailOpen(true);
    };
    return <ListItemPatient key={item.key} item={item} onClick={handleItemOnClick} />;
  });

  return (
    <div className='component-verification-list'>
      <h1>Verified Patient List</h1>
      { loading ? <h2 id="loading-label">Loading Patient List...</h2>  : null}
      {patientList}
    </div>
  );
}

export default NavPatients;
