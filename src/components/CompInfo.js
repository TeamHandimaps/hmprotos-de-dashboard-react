import React, { useState } from "react";
import "./CompInfo.scss";
import { getDatabase, ref, off, onValue } from "firebase/database";

function LabeledField({ title, value }) {
  return <h3>{title}: <span>{value || ''}</span></h3>
}


function CompInfo({ officeID = "office_00" }) {
  const [loading, setLoading] = React.useState(true);
  const [metadata, setMetadata] = useState({});
  const { name, npi, taxid } = metadata.val || {}



  const onErrorHandler = (err) => {
    console.error("Database Error:", err);
  };

  React.useEffect(() => {
    const patientsRef = ref(getDatabase(), `data/${officeID}/meta`);

    const handleMetaSnapshot = (snap) => {
      let data = snap.val();
      console.log("Got meta info", data);
      setMetadata({ key: snap.key, val: data });
      setLoading(false)
    };

    onValue(patientsRef, handleMetaSnapshot, onErrorHandler);

    return () => off(patientsRef);
  }, [officeID]);

  return (
    <div className='comp-info'>
      <h1>Dental Office Saved Information</h1>
      <div className='info-grid'>
        <LabeledField title="Name" value={loading ? 'Loading...' : name}/>
        <LabeledField title="National Provider Identifier (NPI)" value={loading ? 'Loading...' : npi}/>
        <LabeledField title="Tax ID" value={loading ? 'Loading...' : taxid}/>
      </div>
    </div>
  );
}

export default CompInfo;
