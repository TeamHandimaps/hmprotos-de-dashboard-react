import React from "react";
import "./NavPatients.scss";

import ListItemPatient from "./ListItemPatient";

import { getDatabase, ref, off, onValue } from "firebase/database";
import CompPatientInfoDetail from "./CompPatientInfoDetail";
import { useAuth } from "../context/AuthContext";

/** Handles rendering the top-level "Patients" page in the navigation. */
function NavPatients() {
  const {
    user: { office },
  } = useAuth();
  const [loading, setLoading] = React.useState(true);
  const [patients, setPatients] = React.useState([]);
  const [selectedPatient, setSelectedPatient] = React.useState({});
  const [detailOpen, setDetailOpen] = React.useState(false);

  React.useEffect(() => {
    const patientsRef = ref(getDatabase(), `data/${office}/patients`);

    // grab all patients
    const handlePatientsSnapshot = (snap) => {
      let items = [];
      snap.forEach((child) => {
        items.push({ key: child.key, val: child.val() });
      });
      setPatients(items);
      setLoading(false);
    };

    // run everytime we see value change
    onValue(patientsRef, handlePatientsSnapshot, (err) => {
      console.error("Database Error:", err);
      setLoading(false);
    });

    return () => off(patientsRef);
  }, [office]);

  // detail open ? render that instead
  if (detailOpen) {
    const handleOnBack = () => setDetailOpen(false);
    return <CompPatientInfoDetail item={selectedPatient} onBack={handleOnBack} />;
  }

  /** Helper to handle item on click logic. */
  const handleItemOnClick = (item) => {
    setSelectedPatient(item);
    setDetailOpen(true);
  };

  return (
    <div className='component-verification-list'>
      <h1>Verified Patient List</h1>
      {loading ? <h2 id='loading-label'>Loading Patient List...</h2> : null}
      {patients.map((item) => (
        <ListItemPatient key={item.key} item={item} onClick={() => handleItemOnClick(item)} />
      ))}
    </div>
  );
}

export default NavPatients;
